import * as github from '@actions/github'
import * as core from '@actions/core'

export type CoreModule = typeof core
export type GitHubModule = typeof github
export type Context = typeof github.context
export type Client = github.GitHub

export interface Config {
    whitelist: string[]
    blacklist: string[]
    method?: 'merge' | 'squash' | 'rebase'
    passing_status_checks: string[]
}
