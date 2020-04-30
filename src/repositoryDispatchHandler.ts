import WebHooks = require('@octokit/webhooks')
import { Client, Context, Config } from './types'
import isEnabledForPR from './isEnabledForPR'
import canMerge from './canMerge'

export default async function repositoryDispatchHandler(
    client: Client,
    context: Context,
    config: Config,
) {
    const event = context.payload as WebHooks.WebhookPayloadRepositoryDispatch
    console.log('Action: ', event.action)
    console.log('Client Payload ', event.client_payload)

    // TODO: Make config parameter
    if (event.action !== 'hydra-finished-all-jobs') {
        console.log('Not a hydra-finished-all-jobs event, skipping')
        return
    }

    type HydraPayload = {
        pr: string
    }

    // TODO: The type in the Webhooks index.d.ts file is
    // type WebhookPayloadRepositoryDispatchClientPayload = {
    //    unit: boolean;
    //    integration: boolean;
    // };
    // Think this is just an example rather than mandated by GitHub, but it's
    // why we have to treat this `as unknown` first.
    const payload = (event.client_payload as unknown) as HydraPayload

    // TODO: Sanity check this in case it can fail
    let pr_number = Number(payload.pr)

    // TODO: This duplicates code in mergeIfReady. mergeIfReady wants the full
    // pr, not just the number.
    // Should look at what other info can be returned from Hydra, in particular,
    // if we can get the label names from the PR.

    const owner = context.repo.owner
    const repo = context.repo.repo

    const pr = await client.pulls.get({
        owner,
        repo,
        pull_number: pr_number,
    })

    const label_names = pr.data.labels.map((label) => label.name)
    if (!isEnabledForPR(label_names, config.whitelist, config.blacklist)) {
        console.log(
            'repositoryDispatchHandler: Not enabled for this PR, skipping',
        )
        return
    }

    if (pr.data.mergeable_state === 'behind') {
        console.log(
            'repositoryDispatchHandler: PR is behind base: {}',
            pr.data.base.ref,
        )
        if (config.dry_run) {
            console.log(
                'repositoryDispatchHandler: dry_run enabled, skipping update',
            )
            return
        }
        console.log(
            'repositoryDispatchHandler: Updating branch, {}, {}, {}, {}',
            pr.data.head.sha,
            pr.data.number,
            pr.data.head.repo.name,
            pr.data.head.user.login,
        )
        await client.pulls.updateBranch({
            expected_head_sha: pr.data.head.sha,
            pull_number: pr.data.number,
            repo: pr.data.head.repo.name,
            owner: pr.data.head.user.login,
        })
        return
    }

    if (canMerge(pr.data)) {
        if (config.dry_run) {
            console.log(
                'repositoryDispatchHandler: dry_run enabled, skipping merge',
            )
            return
        }
        console.log(
            'repositoryDispatchHandler: PR can be merged, starting merge',
        )
        await client.pulls.merge({
            owner,
            repo,
            pull_number: pr_number,
            sha: pr.data.head.sha,
            merge_method: config.method,
        })
        console.log('repositoryDispatchHandler: merge completed')
    }
}
