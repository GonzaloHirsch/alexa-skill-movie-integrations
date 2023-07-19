const Alexa = require('ask-sdk-core');
const locale = require('../locales/en-GB');
const { getRandom } = require('../utils/utils');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechText = locale.LAUNCH[getRandom(0, 3)];
        const cardText = speechText;

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard(cardText, speechText)
            .getResponse();
    }
};

module.exports = LaunchRequestHandler;