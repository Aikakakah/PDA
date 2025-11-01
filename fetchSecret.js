// fetchSecret.js
export async function getSecret(ringtoneCode) {
  const res = await fetch(`https://api.github.com/repos/YOURUSER/puzzle-secrets/contents/${ringtoneCode}.json`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
  });
  const data = await res.json();
  return atob(data.content);
}
