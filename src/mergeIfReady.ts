import Octokit = require('@octokit/rest')
import WebHooks = require('@octokit/webhooks')

import { Client, Config } from './types'
import canMerge from './canMerge'
import isEnabledForPR from './isEnabledForPR'

export default async function mergeIfReady(
    client: Client,
    owner: string,
    repo: string,
    pr:
        | WebHooks.WebhookPayloadPullRequestPullRequest
        | WebHooks.WebhookPayloadPullRequestReviewPullRequest
        | Octokit.PullsListResponseItem,
    config: Config,
) {
    console.log('mergeIfReady: start')

    // The different types for 'pr' do not agree on the properties of the
    // objects in the 'labels' array, but they all have a 'name' property.
    const labels = pr.labels as Array<{ name: string }>
    const label_names = labels.map((label) => label.name)

    if (!isEnabledForPR(label_names, config.whitelist, config.blacklist)) {
        console.log('mergeIfReady: Not enabled for this PR, aborting')
        return
    }

    // Although webhook payloads contain "mergeable" and "mergeable_status"
    // values, testing shows that you can't trust them.
    //
    // Per https://developer.github.com/v3/git/#checking-mergeability-of-pull-requests
    // you have to make an explicit request for the PR in order to cause
    // GitHub to check if it's mergeable.
    const pr_refreshed = await client.pulls.get({
        owner,
        repo,
        pull_number: pr.number,
    })
    const pr_data = pr_refreshed.data

    console.log('raw pr', pr)
    console.log('client.pulls.get pr', pr_data)
    console.log('pr and mergeable', pr_data.number, pr_data.mergeable)

    // If mergeable_state is "behind" then this PR can't be merged because
    // it's out of date. Try and rebase it on the most commit on its base.

    // This works, want confirmation that the results are as expected,
    // commenting out temporarily
    // if (pr_data.mergeable_state === 'behind') {
    //     console.log('PR is behind base: {}', pr_data.base.ref)
    //     console.log('Updating branch, {}, {}, {}, {}',
    //         pr_data.head.sha,
    //         pr_data.number,
    //         pr_data.head.repo.name,
    //         pr_data.head.user.login)
    //     await client.pulls.updateBranch({
    //         expected_head_sha: pr_data.head.sha,
    //         pull_number: pr_data.number,
    //         repo: pr_data.head.repo.name,
    //         owner: pr_data.head.user.login,
    //     })
    //     return;
    // }

    if (canMerge(pr_data)) {
        if (config.dry_run) {
            console.log('mergeIfReady: dry_run enabled, skipping merge')
            return
        }
        console.log('mergeIfReady: PR can be merged, starting merge')
        await client.pulls.merge({
            owner,
            repo,
            pull_number: pr.number,
            sha: pr.head.sha,
            merge_method: config.method,
        })
        console.log('mergeIfReady: merge completed')
    }
}
