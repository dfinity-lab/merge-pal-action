import { Client, Config } from './types'
import canMerge from './canMerge'
import isEnabledForPR from './isEnabledForPR'

export default async function mergeIfReady(
    client: Client,
    owner: string,
    repo: string,
    number: number,
    sha: string,
    config: Config,
) {
    console.log('mergeIfReady: start')

    const pr = await client.pulls.get({
        owner,
        repo,
        pull_number: number,
    })
    if (!isEnabledForPR(pr.data, config.whitelist, config.blacklist)) {
        console.log('mergeIfReady: Not enabled for this PR, aborting')
        return
    }
    console.log('raw pr.data', pr.data)
    console.log(
        'pr and mergeable',
        pr.data.number,
        pr.data.mergeable,
        pr.data.mergeable_state,
    )
    if (canMerge(pr.data)) {
        console.log('mergeIfReady: PR can be merged, starting merge')
        await client.pulls.merge({
            owner,
            repo,
            pull_number: number,
            sha,
            merge_method: config.method,
        })
        console.log('mergeIfReady: merge completed')
    }
}
