import Octokit = require('@octokit/rest')
const isEnabledForPR = jest.fn()
jest.mock('../isEnabledForPR', () => isEnabledForPR)
const canMerge = jest.fn()
jest.mock('../canMerge', () => canMerge)
import mergeIfReady from '../mergeIfReady'
import { Client, Config } from '../types'

/**
 * Generates a fake PullsGetResponse structure with necessary properties
 * filled out.
 * 
 * @param number Pull Request number
 * @param mergeable Whether this PR should be mergeable
 */
function getPullRequest(number: number, mergeable: boolean): Octokit.PullsGetResponse {
    return {
        labels: [] as Array<Octokit.PullsGetResponseLabelsItem>,
        number,
        head: { sha: 'abcdef' },
        mergeable,
        mergeable_state: 'clean'
    } as Octokit.PullsGetResponse
}

/**
 * Returns a fake Client.
 * 
 * Can't return the actual Client type because types on the `merge` and
 * `get` properties differ.
 */
function getClient() {
    return {
        pulls: {
            merge: jest.fn(),
            get: jest.fn()
        }
    }
}

describe('mergeIfReady', () => {
    beforeEach(async () => {
        canMerge.mockClear()
        isEnabledForPR.mockClear()
    })
    it('exits early if automation is not enabled', async () => {
        const client = getClient()
        const prNumber = 42
        const repo = 'repo'
        const owner = 'owner'
        canMerge.mockReturnValue(false)
        const mockPR = {
            data: getPullRequest(prNumber, false)
        } as Octokit.Response<Octokit.PullsGetResponse>
        const whitelist = []
        const blacklist = []
        const passing_status_checks = []
        const config: Config = {
            whitelist,
            blacklist,
            passing_status_checks,
        }
        isEnabledForPR.mockReturnValueOnce(false)
        client.pulls.get.mockReturnValueOnce(mockPR)
        await mergeIfReady(
            (client as unknown) as Client,
            owner,
            repo,
            mockPR.data,
            config,
        )
        expect(isEnabledForPR).toHaveBeenCalledTimes(1)
        expect(isEnabledForPR).toHaveBeenCalledWith(
            [],
            config.whitelist,
            config.blacklist,
        )

        // Should not have made any API calls
        expect(client.pulls.get).toHaveBeenCalledTimes(0)
        expect(canMerge).toHaveBeenCalledTimes(0)
        expect(client.pulls.merge).toHaveBeenCalledTimes(0)
    })
    it.each`
        method
        ${undefined}
        ${'merge'}
        ${'squash'}
        ${'rebase'}
    `('merges pr with $method if it can be merged', async ({ method }) => {
        const client = getClient()
        const prNumber = 42
        const repo = 'repo'
        const owner = 'owner'
        const mockPR = {
            data: getPullRequest(prNumber, true)
        }

        isEnabledForPR.mockReturnValueOnce(true)
        client.pulls.get.mockReturnValue(mockPR)
        canMerge.mockReturnValue(true)

        const config: Config = {
            whitelist: [],
            blacklist: [],
            method,
            passing_status_checks: []
        }

        await mergeIfReady(
            (client as unknown) as Client,
            owner,
            repo,
            mockPR.data,
            config,
        )
        expect(isEnabledForPR).toHaveBeenCalledWith(
            [],
            config.whitelist,
            config.blacklist,
        )
        expect(client.pulls.get).toHaveBeenCalledTimes(1)
        expect(client.pulls.get).toHaveBeenCalledWith({
            owner,
            repo,
            pull_number: prNumber,
        })
        expect(canMerge).toHaveBeenCalledTimes(1)
        expect(canMerge).toHaveBeenCalledWith(mockPR.data)
        expect(client.pulls.merge).toHaveBeenCalledTimes(1)
        expect(client.pulls.merge).toHaveBeenCalledWith({
            owner,
            repo,
            pull_number: prNumber,
            sha: mockPR.data.head.sha,
            merge_method: method,
        })
    })
    it('does not merge pr if it is not allowed to merge', async () => {
        const client = getClient()
        const prNumber = 42
        const repo = 'repo'
        const owner = 'owner'
        canMerge.mockReturnValue(false)
        const mockPR = {
            data: getPullRequest(prNumber, false)
        } as Octokit.Response<Octokit.PullsGetResponse>
        const config: Config = {
            whitelist: [],
            blacklist: [],
            passing_status_checks: [],
        }
        isEnabledForPR.mockReturnValueOnce(true)
        client.pulls.get.mockReturnValueOnce(mockPR)
        await mergeIfReady(
            (client as unknown) as Client,
            owner,
            repo,
            mockPR.data,
            config,
        )
        expect(isEnabledForPR).toHaveBeenCalledTimes(1)
        expect(isEnabledForPR).toHaveBeenCalledWith(
            [],
            config.whitelist,
            config.blacklist,
        )
        expect(client.pulls.get).toHaveBeenCalledTimes(1)
        expect(client.pulls.get).toHaveBeenCalledWith({
            owner,
            repo,
            pull_number: prNumber,
        })
        expect(canMerge).toHaveBeenCalledTimes(1)
        expect(canMerge).toHaveBeenCalledWith(mockPR.data)
        expect(client.pulls.merge).toHaveBeenCalledTimes(0)
    })
})
