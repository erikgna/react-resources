import useSWRMutation from "swr/mutation";
// Fetcher implementation.
// The extra argument will be passed via the `arg` property of the 2nd parameter.
// In the example below, `arg` will be `'my_token'`
async function sendRequest(
  url: string,
  { arg }: { arg: { username: string } },
) {
  return fetch(url, {
    method: "POST",
    body: JSON.stringify(arg),
  }).then((res) => res.json());
}

export function Profile() {
  // A useSWR + mutate like API, but it will not start the request automatically.
  const { trigger, isMutating } = useSWRMutation("/api/user", sendRequest);

  return (
    <button
      onClick={async () => {
        // Trigger `updateUser` with a specific argument.
        const result = await trigger({ username: "johndoe" });
      }}
    >
      Update User
    </button>
  );
}
