import * as fs from 'fs'
import jsyaml from 'js-yaml'
import { Config } from './types'

export class InvalidConfigurationError extends Error {
    constructor(message?: string) {
        super(message)
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, InvalidConfigurationError.prototype)
    }
}

export class MissingConfigurationError extends Error {
    constructor(message?: string) {
        super(message)
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, MissingConfigurationError)
    }
}

export function parseConfig(rawConfig: any): Config {
    const result: Config = {
        whitelist: [],
        blacklist: [],
        method: undefined,
    }
    if (rawConfig && rawConfig.whitelist) {
        if (Array.isArray(rawConfig.whitelist)) {
            result.whitelist = rawConfig.whitelist
        } else {
            throw new InvalidConfigurationError(
                '`whitelist` should be an array',
            )
        }
    }
    if (rawConfig && rawConfig.blacklist) {
        if (Array.isArray(rawConfig.blacklist)) {
            result.blacklist = rawConfig.blacklist
        } else {
            throw new InvalidConfigurationError(
                '`blacklist` should be an array',
            )
        }
    }
    if (rawConfig && rawConfig.method) {
        const allowedString = ['squash', 'merge', 'rebase']
        if (
            typeof rawConfig.method !== 'string' ||
            !allowedString.includes(rawConfig.method)
        ) {
            throw new InvalidConfigurationError(
                `'method' should be either 'merge', 'rebase', 'squash' or 'undefined', got ${rawConfig.method}`,
            )
        }
        result.method = rawConfig.method
    }
    return result
}

function getFileData(filename: string) {
    try {
        return fs.readFileSync(filename).toString()
    } catch (error) {
        throw new MissingConfigurationError(
            `Did not find config ${filename}: ${error}`,
        )
    }
}

export default function readConfig(filename: string): Config {
    const cwd = process.cwd()
    console.log('cwd', cwd)
    const data = getFileData(filename)
    const yaml = jsyaml.safeLoad(data)
    return parseConfig(yaml)
}
