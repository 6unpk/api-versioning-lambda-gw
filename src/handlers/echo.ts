
const handler = async (event) => {
    return {
        statusCode: 200,
        body: 'not echo'
    };
}

export const main = handler;
