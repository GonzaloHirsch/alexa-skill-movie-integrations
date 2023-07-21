const Alexa = require('ask-sdk-core');
const util = require('util');
const { getMovie } = require('../utils/client');

const AskRandomMovieIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'RandomMovieIntent'
    );
  },
  async handle(handlerInput) {
    console.log(util.inspect(handlerInput.requestEnvelope, true, null, false));
    const sessionAttributes =
      handlerInput.attributesManager.getSessionAttributes();

    // Generate a random movie
    let foundMovie = false,
      currentTry = 0,
      randomMovieId = 0,
      movieResponse = null;
    while (!foundMovie && currentTry <= 5) {
      // Generate a random ID
      randomMovieId = Math.floor(Math.random() * 1100000) + 1;
      // Look for that movie
      movieResponse = await getMovie(randomMovieId);
      console.log(
        `Try ${currentTry} for movie ${randomMovieId}. Got ${util.inspect(
          movieResponse,
          true,
          null,
          false
        )}`
      );
      // Found a movie if success state and not an adult movie
      if (movieResponse && !movieResponse.adult) foundMovie = true;
      currentTry += 1;
    }

    // Check if it found a movie
    if (!foundMovie) {
      console.error(`Didn't find a random movie, tried ${currentTry} times.`);
      return handlerInput.responseBuilder
        .speak(
          `Sorry, I couldn't find a suitable movie right now. Please try again later.`
        )
        .reprompt(
          `Sorry, I couldn't find a suitable movie right now. Please try again later.`
        )
        .withShouldEndSession(!sessionAttributes.keepSessionOpen)
        .getResponse();
    }

    // Prepare the responses
    const speechText = `I found a movie for you! The movie is ${movieResponse.title}. ${movieResponse.overview}`;
    const cardText = `I found a movie for you! The movie is ${movieResponse.title}.`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard(cardText, speechText)
      .withShouldEndSession(!sessionAttributes.keepSessionOpen)
      .getResponse();
  }
};

module.exports = AskRandomMovieIntentHandler;
