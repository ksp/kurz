module.exports = {
    transform: {
        '^.+\\.ts?$': 'ts-jest',
        '^.+\\.svelte$': 'svelte-jester',
    },
    testEnvironment: 'jsdom',
    testRegex: '.*\\.test?\\.ts$',
    moduleFileExtensions: ['ts', 'js', 'svelte']
};
