module.exports = {
    transform: {
        '^.+\\.ts?$': 'ts-jest',
        '^.+\\.svelte$': [
            'svelte-jester',
            { "preprocess": true }
        ]
    },
    testEnvironment: 'jsdom',
    testRegex: '.*\\.test?\\.[tj]s$',
    moduleFileExtensions: ['ts', 'js', 'svelte']
};
