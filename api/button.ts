export default async function (req, res) {
  const { source, target } = req.query;
  if (!source || !target) {
    res.send(
      `<body>Please add <code>?source={database_id}&target={page_id}</code> at the end of the embed URL</body>`
    );
    return res.status(400);
  }

  // Use button because form will load the result.
  return res.send(`<body>
      <form action="/api/generate" method="post">
        <input type="hidden" name="source" value="${source}" />
        <input type="hidden" name="target" value="${target}" />
        <button>Refresh</button>
      </form>
    </body>`);
}
