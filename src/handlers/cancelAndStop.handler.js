const Alexa = require('ask-sdk-core');

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      (Alexa.getIntentName(handlerInput.requestEnvelope) ===
        'AMAZON.CancelIntent' ||
        Alexa.getIntentName(handlerInput.requestEnvelope) ===
          'AMAZON.StopIntent')
    );
  },
  handle(handlerInput) {
    const speechText = 'Goodbye! Enjoy your movie!';
    const cardText = speechText;

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard(cardText, speechText)
      .withShouldEndSession(true)
      .getResponse();
  }
};

module.exports = CancelAndStopIntentHandler;
