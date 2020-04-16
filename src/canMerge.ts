import Octokit = require('@octokit/rest')

export function canMergeByMergeable(pr: Octokit.PullsGetResponse) {
    return pr.mergeable
}

// Note, mergeable_state is an undocumented field
// (per https://github.community/t5/GitHub-API-Development-and/PullRequest-mergeable-state-possible-values/td-p/21943)
// with some possible values noted in https://github.com/octokit/octokit.net/issues/1763
export function canMergeByMergeableState(pr: Octokit.PullsGetResponse) {
    return pr.mergeable_state === 'clean' || pr.mergeable_state === 'unstable'
}
export default function canMerge(pr: Octokit.PullsGetResponse) {
    const byMergeable = canMergeByMergeable(pr)
    const byMergeableState = canMergeByMergeableState(pr)
    console.log('by mergeable', byMergeable)
    console.log('by mergeable state', byMergeableState)
    return byMergeable && byMergeableState
}
