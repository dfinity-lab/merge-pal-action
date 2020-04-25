const mergeIfReady = jest.fn()
jest.mock('../mergeIfReady', () => mergeIfReady)

import statusHandler from '../statusHandler'
import { Client, Context, Config } from '../types'

const mockList = jest.fn()
const merge = jest.fn()
const get = jest.fn()

const client = {
    pulls: {
        list: mockList,
        merge,
        get,
    },
}

describe('status handler', () => {
    it('should merge prs for which current commit is HEAD', async () => {
        const owner = 'john doe'
        const repo = 'repo'
        const context = {
            repo: { repo, owner },
            eventName: 'status',
            payload: {
                sha: 'abcdef',
                state: 'success',
                branches: [
                    {
                        name: 'first',
                    },
                    {
                        name: 'second',
                    },
                    {
                        name: 'third',
                    },
                ],
            },
        }
        const fakeConfig = {}
        mockList.mockReturnValueOnce({ data: [] })
        mockList.mockReturnValueOnce({ data: [{ number: 2 }] })
        mockList.mockReturnValueOnce({ data: [{ number: 3 }] })
        get.mockReturnValueOnce({ data: { number: 2, mergeable: false } })
        get.mockReturnValueOnce({ data: { number: 3, mergeable: true } })
        await statusHandler(
            (client as unknown) as Client,
            (context as unknown) as Context,
            (fakeConfig as unknown) as Config,
        )
        expect(mergeIfReady).toHaveBeenCalledTimes(2)
        expect(mergeIfReady).toHaveBeenCalledWith(
            client,
            owner,
            repo,
            2,
            'abcdef',
            fakeConfig,
        )
        expect(mergeIfReady).toHaveBeenCalledWith(
            client,
            owner,
            repo,
            3,
            'abcdef',
            fakeConfig,
        )
        expect(client.pulls.list).toHaveBeenCalledTimes(3)
        expect(client.pulls.list).toHaveBeenNthCalledWith(1, {
            owner,
            repo,
            state: 'open',
            head: 'dfinity-lab:first',
        })
        expect(client.pulls.list).toHaveBeenNthCalledWith(2, {
            owner,
            repo,
            state: 'open',
            head: 'dfinity-lab:second',
        })
        expect(client.pulls.list).toHaveBeenNthCalledWith(3, {
            owner,
            repo,
            state: 'open',
            head: 'dfinity-lab:third',
        })
    })
})
