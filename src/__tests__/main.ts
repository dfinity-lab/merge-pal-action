const mockPRHandler = jest.fn()
jest.mock('../prHandler', () => mockPRHandler)
const mockStatusHandler = jest.fn()
jest.mock('../statusHandler', () => mockStatusHandler)
const mockReviewHandler = jest.fn()
jest.mock('../reviewHandler', () => mockReviewHandler)
const fakePushHandler = jest.fn()
jest.mock('../pushHandler', () => fakePushHandler)
const fakeConfig = {}
const mockReadConfig = jest.fn().mockReturnValue(fakeConfig)
jest.mock('../readConfig', () => mockReadConfig)

import main from '../main'
import { CoreModule, GitHubModule } from '../types'
import { GitHub } from '@actions/github'

const fakeRateLimit = {
    limit: 1000,
    remaining: 990,
    reset: 123
}

const fakeClient = {
    rateLimit: {
        get: jest.fn(() => { 
            return {
                data: {
                    resources: {
                        core: fakeRateLimit
                        }
                    }
                }
            })
    }
}

describe('main behavior', () => {
    afterEach(() => {
        mockStatusHandler.mockClear()
        mockPRHandler.mockClear()
        mockReviewHandler.mockClear()
        mockReadConfig.mockClear()
    })
    describe('basic things', () => {
        it('should read inputs and initialize client', async () => {
            const mockInput = jest.fn().mockReturnValueOnce('token-123')
            const core = {
                debug: jest.fn(),
                getInput: mockInput,
                group: jest.fn(),
                info: jest.fn(),
                setFailed: jest.fn(),
            }
            const github = {
                context: {},
                GitHub: jest.fn(token => fakeClient)
            }
            await main(
                (core as unknown) as CoreModule,
                (github as unknown) as GitHubModule,
            )
            expect(mockInput).toHaveBeenCalledWith('token')
            expect(github.GitHub).toHaveBeenCalledWith('token-123')
        })
    })
    describe('behavior on pull request', () => {
        it('should call merge processor', async () => {
            const mockInput = jest.fn().mockReturnValueOnce('token-123')
            const core = {
                debug: jest.fn(),
                getInput: mockInput,
                group: (_, fn) => fn(),
                info: jest.fn(),
                setFailed: jest.fn(),
            }
            const github = {
                context: {
                    eventName: 'pull_request',
                },
                GitHub: jest.fn(token => fakeClient)
            }
            await main(
                (core as unknown) as CoreModule,
                (github as unknown) as GitHubModule,
            )
            expect(mockReadConfig).toHaveBeenCalledTimes(1)
            expect(mockReadConfig).toHaveBeenCalledWith('.mergepal.yml')
            expect(mockPRHandler).toHaveBeenCalledWith(
                fakeClient,
                github.context,
                fakeConfig,
            )
            expect(fakePushHandler).toHaveBeenCalledTimes(0)
            expect(mockStatusHandler).toHaveBeenCalledTimes(0)
            expect(mockReviewHandler).toHaveBeenCalledTimes(0)
        })
    })
    describe('behavior on status', () => {
        it('should call status handler on status event', async () => {
            const mockInput = jest.fn().mockReturnValueOnce('token-123')
            const core = {
                debug: jest.fn(),
                getInput: mockInput,
                group: (_, fn) => fn(),
                info: jest.fn(),
                setFailed: jest.fn(),
            }
            const github = {
                context: {
                    eventName: 'status',
                },
                GitHub: jest.fn(token => fakeClient)
            }
            await main(
                (core as unknown) as CoreModule,
                (github as unknown) as GitHubModule,
            )
            expect(mockReadConfig).toHaveBeenCalledTimes(1)
            expect(mockReadConfig).toHaveBeenCalledWith('.mergepal.yml')
            expect(mockPRHandler).toHaveBeenCalledTimes(0)
            expect(mockReviewHandler).toHaveBeenCalledTimes(0)
            expect(fakePushHandler).toHaveBeenCalledTimes(0)
            expect(mockStatusHandler).toHaveBeenCalledWith(
                fakeClient,
                github.context,
                fakeConfig,
            )
        })
    })
    describe('behavior on review', () => {
        it('should call review handler on review event', async () => {
            const mockInput = jest.fn().mockReturnValueOnce('token-123')
            const core = {
                debug: jest.fn(),
                getInput: mockInput,
                group: (_, fn) => fn(),
                info: jest.fn(),
                setFailed: jest.fn(),
            }

            const github = {
                context: {
                    eventName: 'pull_request_review',
                },
                GitHub: jest.fn(token => fakeClient)
            }
            await main(
                (core as unknown) as CoreModule,
                (github as unknown) as GitHubModule,
            )
            expect(mockReadConfig).toHaveBeenCalledTimes(1)
            expect(mockReadConfig).toHaveBeenCalledWith('.mergepal.yml')
            expect(mockPRHandler).toHaveBeenCalledTimes(0)
            expect(mockStatusHandler).toHaveBeenCalledTimes(0)
            expect(fakePushHandler).toHaveBeenCalledTimes(0)
            expect(mockReviewHandler).toHaveBeenCalledWith(
                fakeClient,
                github.context,
                fakeConfig,
            )
        })
    })
    describe('behavior on push', () => {
        it('should call push handler on push event', async () => {
            const mockInput = jest.fn().mockReturnValueOnce('token-123')
            const core = {
                debug: jest.fn(),
                getInput: mockInput,
                group: (_, fn) => fn(),
                info: jest.fn(),
                setFailed: jest.fn(),
            }
            const github = {
                context: {
                    eventName: 'push',
                },
                GitHub: jest.fn(token => fakeClient)
            }
            await main(
                (core as unknown) as CoreModule,
                (github as unknown) as GitHubModule,
            )
            expect(mockReadConfig).toHaveBeenCalledTimes(1)
            expect(mockReadConfig).toHaveBeenCalledWith('.mergepal.yml')
            expect(mockPRHandler).toHaveBeenCalledTimes(0)
            expect(mockStatusHandler).toHaveBeenCalledTimes(0)
            expect(mockReviewHandler).toHaveBeenCalledTimes(0)
            expect(fakePushHandler).toHaveBeenCalledWith(
                fakeClient,
                github.context,
                fakeConfig,
            )
        })
    })
})
