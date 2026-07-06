import { useState } from "react";
import axios from "axios";

function App() {

  const [url, setUrl] = useState("");
  const [repo, setRepo] = useState(null);

  const analyzeRepo = async () => {

    const response = await axios.post(
      "http://localhost:5000/analyze",
      {
        repo_url: url
      }
    );

    setRepo(response.data);
  };

  return (
    <div>

      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="GitHub Repository URL"
      />

      <button onClick={analyzeRepo}>
        Analyze
      </button>

      {repo && (
        <div>

          <h2>{repo.name}</h2>

          <p>{repo.description}</p>

          <h3>Open Issues</h3>

          <ul>
            {repo.issues.map(issue => (
              <li key={issue.number}>
                #{issue.number} - {issue.title}
              </li>
            ))}
          </ul>

        </div>
      )}

    </div>
  );
}

export default App;