import isEnabledForPR from '../isEnabledForPR'
import Octokit = require('@octokit/rest')

export function createPR(
    mergeable: boolean,
    mergeable_state: string,
    labels: string[],
): Octokit.PullsGetResponse {
    return {
        mergeable_state,
        mergeable,
        labels: labels.map((label) => ({ name: label })) as any,
    } as any
}

describe('isEnabledForPR', () => {
    it('allows automation with any labels if blacklist and whitelist are empty', () => {
        expect(isEnabledForPR([], [], [])).toBe(true)
        expect(isEnabledForPR(['white'], [], [])).toBe(
            true,
        )
        expect(isEnabledForPR(['black'], [], [])).toBe(
            true,
        )
        expect(
            isEnabledForPR(['white', 'black'], [], []),
        ).toBe(true)
    })
    it('allows automation if whitelist label exists while blacklist is empty', () => {
        const whitelist = ['white']
        const blacklist = []
        expect(
            isEnabledForPR(
                ['white', 'black'],
                whitelist,
                blacklist,
            ),
        ).toEqual(true)
    })
    it('disallows automation if no labels match whitelist', () => {
        const whitelist = ['white']
        const blacklist = []
        expect(
            isEnabledForPR(
                ['yellow', 'black'],
                whitelist,
                blacklist,
            ),
        ).toEqual(false)
    })
    it('disallows automation when whitelist and blacklists exist but labels are empty', () => {
        const whitelist = ['white']
        const blacklist = ['black']
        expect(
            isEnabledForPR([], whitelist, blacklist),
        ).toEqual(false)
    })
    it('disallows automation even if one label matches blacklist', () => {
        const whitelist = []
        const blacklist = ['black']
        expect(
            isEnabledForPR(
                ['yellow', 'white', 'black'],
                whitelist,
                blacklist,
            ),
        ).toEqual(false)
    })
    it('allows automation when none of pr labels match blacklist', () => {
        const whitelist = []
        const blacklist = ['black']
        expect(
            isEnabledForPR(
                ['yellow', 'white'],
                whitelist,
                blacklist,
            ),
        ).toEqual(true)
    })
    it('disallows automation when both black and white labels match', () => {
        const whitelist = ['white']
        const blacklist = ['black']
        expect(
            isEnabledForPR(
                ['white', 'black'],
                whitelist,
                blacklist,
            ),
        ).toBe(false)
    })
})
