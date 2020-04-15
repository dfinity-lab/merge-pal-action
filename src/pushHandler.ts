import { Client, Context, Config, PushPayload } from './types'
import Octokit = require('@octokit/rest')
import isEnabledForPR from './isEnabledForPR'

export default async function pushHandler(
    client: Client,
    context: Context,
    config: Config,
) {
    const payload = context.payload as PushPayload
    console.log('pushHandler: payload: ', payload)
    const components = payload.ref.split('/')
    console.log('pushHandler: components: ', components)
    const branchName = components[components.length - 1]
    console.log('pushHandler: branchName: ', branchName)

    console.log('pushHandler: Listing open PRs')
    const openedPrs = await client.pulls.list({
        ...context.repo,
        state: 'open',
        base: branchName,
    })
    console.log('opened prs', openedPrs)
    await Promise.all(
        openedPrs.data.map((pr) => {
            console.log('pushHandler: Processing PR: ', pr)
            if (!isEnabledForPR(pr, config.whitelist, config.blacklist)) {
                console.log('pushHandler: not enabled for this PR, returning')
                return
            }
            console.log(
                'pushHandler: enabled for this PR, starting updateBranch',
            )
            let ret = client.pulls.updateBranch({
                ...context.repo,
                pull_number: pr.number,
                expected_head_sha: pr.head.sha,
            })
            console.log('pushHandler: updateBranch completed')
            return ret
        }),
    )
}
