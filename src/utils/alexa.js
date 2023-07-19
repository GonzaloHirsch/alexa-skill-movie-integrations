
const buildResponse = (success, payload) => {
    return {
        success: success,
        payload: payload
    }
}

const getCountryCode = async (handlerInput) => {
    // Split variables
    const { requestEnvelope, serviceClientFactory, responseBuilder } = handlerInput;
    // Get the consent token for the location
    const consentToken = requestEnvelope.context.System.user.permissions
        && requestEnvelope.context.System.user.permissions.consentToken;
    if (!consentToken) {
        return buildResponse(false, responseBuilder
            .speak('Please enable Location permissions for this skill in the Amazon Alexa app.')
            .reprompt('Please enable Location permissions for this skill in the Amazon Alexa app.')
            // .withAskForPermissionsConsentCard(['read::alexa:device:all:address'])
            .getResponse());
    }

    // Try to get the address
    try {
        const { deviceId } = requestEnvelope.context.System.device;
        const deviceAddressServiceClient = serviceClientFactory.getDeviceAddressServiceClient();

        // Try to get the full address
        const address = await deviceAddressServiceClient.getCountryAndPostalCode(deviceId);

        // Only intend on looking for the country code
        if (address.countryCode === null) {
            return buildResponse(false, responseBuilder
                .speak(`It looks like you don't have an address set. You can set your address from the companion app.`)
                .reprompt(`It looks like you don't have an address set. You can set your address from the companion app.`)
                .getResponse());
        }
        return buildResponse(true, address.countryCode);
    } catch (error) {
        if (error.name !== 'ServiceError') {
            console.error(`Error response: ${error.message}`)
            return buildResponse(false, responseBuilder
                .speak('Uh Oh. Looks like something went wrong.')
                .reprompt('Uh Oh. Looks like something went wrong.')
                .getResponse());
        }
        throw error;
    }
}

module.exports = {
    getCountryCode
}

