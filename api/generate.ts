import { Client } from '@notionhq/client';
import { GetPageResponse } from '@notionhq/client/build/src/api-endpoints';
import forEachRow from 'notion-for-each-row';

export default async function (req, res) {
  const { source, target } = req.body;
  const token = process.env.NOTION_TOKEN;
  let notion: Client;

  console.log(token, source, target);
  const rows = [] as GetPageResponse[];

  await forEachRow(
    {
      token,
      database: source,
    },
    async (row, _notion: Client) => {
      rows.push(row);
      notion = _notion;
    }
  );
  console.log('rows', rows);

  const blocks = (
    await notion.blocks.children.list({
      block_id: target,
      page_size: 100, // TODO: more
    })
  ).results;

  console.log('blocks', blocks);

  // find first embed and
  // @ts-expect-error
  const firstEmbedIndex = blocks.findIndex((b) => b.type === 'embed');
  const deleteStartFrom = firstEmbedIndex + 1;
  console.log('delete start from', deleteStartFrom);
  const deleteReq = Promise.all(
    blocks
      .slice(deleteStartFrom)
      .map((b) => notion.blocks.delete({ block_id: b.id }))
  );

  // append new blocks
  const appendReq = appendRowsToBlock(notion, rows, target);

  await Promise.all([deleteReq, appendReq]);

  return res.status(200).send('{}');
}

async function appendRowsToBlock(
  notion: Client,
  rows: GetPageResponse[],
  parentId: string
) {
  const allPages = await Promise.all(
    rows.map(async (r) => {
      const blocks = (
        await notion.blocks.children.list({
          block_id: r.id,
          page_size: 100,
        })
      ).results;
      return {
        blocks,
        // @ts-expect-error
        properties: r.properties,
      };
    })
  );
  console.log('\nallPages', allPages);
  // TODO: turn properties to block
  // TODO: trim block
  await notion.blocks.children.append({
    block_id: parentId,
    // @ts-expect-error
    children: allPages.flatMap(({ blocks }) => blocks),
  });
}
