/* @flow */

import * as xcomponent from 'xcomponent/src';

export let Button = xcomponent.create({

    tag: 'donate-button',

    url: {
        demo: '/demo/components/button.htm',
        sandbox: 'https://www.sandbox.paypal.com/donatebutton',
        production: 'https://www.paypal.com/donatebutton'
    },

    defaultEnv: 'production',

    contexts: {
        iframe: true,
        popup: false
    },

    dimensions: {
        width: '180px',
        height: '30px'
    },

    props: {

        style: {
            type: 'object',
            required: false,

            def() : { color : string } {
                return {
                    color: 'yellow'
                };
            }
        },

        amount: {
            type: 'object',
            required: true,
            validate(amount) {
                if (!amount.value) {
                    throw new Error(`Expected amount.value`);
                }
                if (!amount.currency) {
                    throw new Error(`Expected amount.currency`);
                }
            }
        },

        onDonate: {
            type: 'function',
            required: true
        }
    }
});
