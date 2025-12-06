import { getAllEvents } from '$lib/server/events';
import { error } from '@sveltejs/kit';

export const load = async () => {
  try {
    console.log("--- ATTEMPTING TO LOAD EVENTS ---");
    const events = await getAllEvents();
    console.log("--- EVENTS LOADED SUCCESSFULLY ---");
    return { events };
  } catch (err) {
    // 1. Log the raw error so you can see it in the terminal
    console.error("!!! SERVER LOAD ERROR !!!", err);
    
    // 2. Safely extract the message for the user response
    // If 'err' is a real Error object, use .message, otherwise use a generic string
    const message = err instanceof Error ? err.message : 'Unknown Server Error';

    // 3. Throw the safe message
    throw error(500, message);
  }
};