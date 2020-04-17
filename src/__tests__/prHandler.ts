const mergeIfReady = jest.fn()
jest.mock('../mergeIfReady', () => mergeIfReady)
import prHandler from '../prHandler'
import { Client, Context, Config } from '../types'

describe('merge processor', () => {
    it('calls mergeIfReady', async () => {
        const client = {
            pulls: {
                merge: jest.fn(),
            },
        }
        const repo = 'nyan cat'
        const owner = 'john doe'
        const context = {
            repo: {
                repo,
                owner,
            },
            payload: {
                pull_request: {
                    number: 100500,
                    head: { sha: 'abcdef' },
                },
            },
        }
        const fakeConfig = {}
        await prHandler(
            (client as unknown) as Client,
            (context as unknown) as Context,
            (fakeConfig as unknown) as Config,
        )
        expect(mergeIfReady).toHaveBeenCalledTimes(1)
        expect(mergeIfReady).toHaveBeenCalledWith(
            client,
            owner,
            repo,
            context.payload.pull_request,
            fakeConfig,
        )
    })
})
