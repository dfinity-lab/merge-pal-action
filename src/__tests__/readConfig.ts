import readConfig, { parseConfig } from '../readConfig'
import * as path from 'path'

describe('config', () => {
    describe('config sanity', () => {
        it.each`
            value
            ${undefined}
            ${null}
            ${{}}
        `('returns default values when input is $value', ({ value }) => {
            expect(parseConfig(value)).toEqual({
                whitelist: [],
                blacklist: [],
                method: undefined,
                passing_status_checks: [],
            })
        })
        it('throws when types mismatch', () => {
            expect(() => {
                parseConfig({
                    whitelist: {},
                })
            }).toThrowError()
            expect(() => {
                parseConfig({
                    blacklist: {},
                })
            }).toThrowError()
            expect(() => {
                parseConfig({
                    method: {},
                })
            }).toThrowError()
            expect(() => {
                parseConfig({
                    method: 'unknown string',
                })
            }).toThrowError()
            expect(() => {
                parseConfig({
                    passing_status_checks: {}
                })
            }).toThrowError()
        })
        it('assigns method', () => {
            expect(parseConfig({ method: 'merge' })).toEqual({
                whitelist: [],
                blacklist: [],
                method: 'merge',
                passing_status_checks: [],
            })
        })
        it('assigns passing_status_checks', () => {
            expect(parseConfig({ passing_status_checks: ['foo']})).toEqual({
                whitelist: [],
                blacklist: [],
                method: undefined,
                passing_status_checks: ['foo'],
            })
        })
    })
    it('throws when config file is missing', () => {
        expect(() => {
            readConfig(path.join(__dirname, '.mergepal.yml'))
        }).toThrowError()
    })    
    it('it parses whitelist and blacklist', () => {
        expect(
            readConfig(path.join(__dirname, './configs/whiteandblack.yml')),
        ).toEqual({
            whitelist: ['white'],
            blacklist: ['black'],
            passing_status_checks: [],
        })
    })
    it('it parses whitelist', () => {
        expect(
            readConfig(path.join(__dirname, './configs/whiteonly.yml')),
        ).toEqual({
            whitelist: ['white'],
            blacklist: [],
            passing_status_checks: [],
        })
    })
    it('it parses blacklist', () => {
        expect(
            readConfig(path.join(__dirname, './configs/blackonly.yml')),
        ).toEqual({
            whitelist: [],
            blacklist: ['black'],
            passing_status_checks: [],
        })
    })
    it('it parses passing_status_checks', () => {
        expect(
            readConfig(path.join(__dirname, './configs/passing_status_checks.yml')),
        ).toEqual({
            whitelist: [],
            blacklist: [],
            passing_status_checks: ['mandatory-check'],
        })
    })
})
