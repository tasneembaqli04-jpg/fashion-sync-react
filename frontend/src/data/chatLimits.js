/**
 * How long a message to the assistant may be.
 *
 * A question a customer actually types is far shorter. The limit exists so a
 * pasted document cannot be sent to the model and charged for.
 *
 * The browser stops an over-long message before it is sent, so the customer
 * is told what is wrong rather than seeing the generic "assistant
 * unavailable" the chat shows for a failed request. The cloud function holds
 * the same limit for anything that reaches it another way; the two numbers
 * must stay in step.
 */
export const MAX_CHAT_MESSAGE_LENGTH = 1000;
