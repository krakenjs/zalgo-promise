module.exports = {
    'extends': './node_modules/grumbler-scripts/config/.eslintrc-typescript.js',

    'globals': {
        "__DEBUG__": "readonly"
    },

    'rules': {
        'promise/no-native': 'off',
        'no-restricted-globals': 'off',
        'max-statements-per-line': 'off',

        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/prefer-for-of': 'off',
        '@typescript-eslint/prefer-nullish-coalescing': 'off',
        '@typescript-eslint/no-base-to-string': 'off'
    }
};
