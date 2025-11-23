// client/src/api/recordingsApi.ts

/**
 * Creates a new recording session on the server.
 * @param userId - A unique identifier for the user.
 * @param language - The language of the recording (e.g., 'en-US').
 * @returns The ID of the newly created recording.
 * @throws Will throw an error if the network request fails.
 */
export const createRecording = async (userId: string, language: string): Promise<string> => {
  const response = await fetch('/api/recordings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, language }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create recording');
  }

  const data = await response.json();
  return data.recordingId;
};

/**
 * Fetches a recording and its transcript segments from the server.
 * @param recordingId - The ID of the recording to fetch.
 * @returns The recording data, including all its segments and words.
 * @throws Will throw an error if the recording is not found or the request fails.
 */
export const getRecording = async (recordingId: string) => {
    const response = await fetch(`/api/recordings/${recordingId}`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch recording ${recordingId}`);
    }
    return response.json();
};
