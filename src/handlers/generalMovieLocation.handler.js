const Alexa = require('ask-sdk-core');
const util = require('util');
const constants = require('../utils/constants');
const { searchMovie, getMovieLocation } = require('../utils/client');
const { getCountryCode } = require('../utils/alexa');
const { prepareMovieList } = require('../utils/responses');

const movieHandler = async (handlerInput, action = constants.ACTIONS.STREAM) => {
    console.log(action, util.inspect(handlerInput.requestEnvelope, true, null, false));
    // Get the target movie and make sure we actually have a movie
    const targetMovie = Alexa.getSlotValue(handlerInput.requestEnvelope, constants.SLOTS.MOVIE_NAME);
    if (!targetMovie) return handlerInput.responseBuilder
        .speak('Sorry, I need a movie to search for you. Please say it again.')
        .reprompt('Sorry, I need a movie to search for you. Please say it again.')
        .getResponse();

    // Request it from the API
    const movieResponse = await searchMovie(targetMovie);
    // If not success, just return the error
    if (movieResponse.status !== 200 || movieResponse.data.total_results <= 0) {
        console.error(`Error response: ${movieResponse}`)
        return handlerInput.responseBuilder
        .speak('Sorry, there was an error looking for that movie. Please say it again.')
        .reprompt('Sorry, there was an error looking for that movie. Please say it again.')
        .getResponse();
    }
    console.log(util.inspect(movieResponse.data, true, null, false))

    // Get the first movie result
    const apiMovie = movieResponse.data.results[0];

    // Try to get the country code
    const countryCodeResponse = await getCountryCode(handlerInput);
    if (!countryCodeResponse.success) return countryCodeResponse.payload;

    // Get the stream providers
    const streamResponse = await getMovieLocation(apiMovie.id, countryCodeResponse.payload, action);
    console.log(util.inspect(streamResponse, true, null, false));
    if (!streamResponse) {
        return handlerInput.responseBuilder
            .speak(`Sorry, I couldn't find any services for ${apiMovie.title}. Please try another movie.`)
            .reprompt(`Sorry, I couldn't find any services for ${apiMovie.title}. Please try another movie.`)
            .getResponse();
    } else if (streamResponse.length <= 0) {
        return handlerInput.responseBuilder
            .speak(`Sorry, it seems like right now you cannot stream ${apiMovie.title}. Maybe try another movie?.`)
            .reprompt(`Sorry, it seems like right now you cannot stream ${apiMovie.title}. Maybe try another movie?.`)
            .getResponse();
    }

    // Prepare the responses
    const speechText = prepareMovieList(action, apiMovie.title, streamResponse.map(obj => obj.provider_name));
    const cardText = speechText;

    return handlerInput.responseBuilder
        .speak(speechText)
        .withSimpleCard(cardText, speechText)
        .getResponse();
}

module.exports = movieHandler