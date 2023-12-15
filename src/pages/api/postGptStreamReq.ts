export async function postGptStreamReq(text: string, setOutputText: React.Dispatch<React.SetStateAction<string>>, type: string) {
     // Fetch the data from the serverless function
  fetch('/api/callGptStream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ resumeText: text, type : type })
  })
  .then(response => {
    // Read the response as a stream
    const reader = response.body?.getReader();
    // Read the next chunk of data
    function readNextChunk(): Promise<void> {
      return (reader as ReadableStreamDefaultReader).read().then(({ done, value }) => {
        if (done) {
          // The stream has ended
          return;
        }
        // Convert the chunk to a string
        const text = new TextDecoder().decode(value);
        setOutputText(prevText => prevText + text);
        // Read the next chunk
        return readNextChunk();
      });
    }
    // Start reading the stream
    return readNextChunk();
  })
  .catch(error => {
    console.error('Error:', error);
  });
  }