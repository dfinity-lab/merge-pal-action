import WebHooks = require('@octokit/webhooks')
import { Client, Context, Config } from './types'
import mergeIfReady from './mergeIfReady'

export default async function statusHandler(
    client: Client,
    context: Context,
    config: Config,
) {
    const event = context.payload as WebHooks.WebhookPayloadStatus
    console.log('Status check for: ', event.context)
    console.log('Status check state: ', event.state)

    if (event.state !== 'success') {
        console.log('Not a successful result status check, skipping')
        return
    }

    // Performance fix: If this isn't the aggregate job that contains all others
    // then there's nothing to do yet because we don't know that the PR is good
    // to go.
    //
    // You could read this out of the branch protection rules, but that requires
    // an API call, and the point is to not need to make API calls unless
    // absolutely necessary.
    //
    // TODO: This could even be a separate action that runs before the others
    // so we don't incur the overhead of needing to check out the repo

    // If config.passing_status_checks is set then check to see if this is one
    // we care about (if it's not set then we care about all status checks)
    if (config.passing_status_checks.length) {
        let check_ok = false
        for (let check_name of config.passing_status_checks) {
            if (check_name === event.context) {
                check_ok = true
                break
            }
        }

        if (!check_ok) {
            console.log(
                `'${event.context}' not found in ${config.passing_status_checks}, skipping`,
            )
            return
        }
    }

    console.log('Status Payload:')
    console.log(event)
    const branchNames = event.branches.map((branch) => branch.name)
    console.log('Commit belongs to branches: ', branchNames)

    // Bug fix
    //
    // `head` is a `:` separated pair, first entry should be the organisation,
    // followed by the branch name, not just the branch name.
    //
    // Note: 'dfinity-lab' is the value of event.organization.login and
    // event.repository.owner.login
    //
    // https://developer.github.com/v3/pulls/#list-pull-requests describes
    // the format as 'user:ref-name' or 'organization:ref-name', so
    // event.organization.login is probably the better value
    const prs = await Promise.all(
        branchNames.map((branch) =>
            client.pulls.list({
                ...context.repo,
                head: `dfinity-lab:${branch}`, // TODO: Make a config option or infer
                state: 'open',
            }),
        ),
    )

    console.log('PRs before flattening')
    console.log(prs)

    const flatPRs = prs.flatMap((item) => {
        return item.data.map((pr) => pr)
    })

    console.log('PRs after flattening')
    console.log(flatPRs)

    await Promise.all(
        flatPRs.map((pr) =>
            mergeIfReady(
                client,
                context.repo.owner,
                context.repo.repo,
                pr,
                config,
            ),
        ),
    )
}
