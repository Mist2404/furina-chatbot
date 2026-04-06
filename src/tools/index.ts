import { Context } from 'koishi';
import * as arknightsTool from './arknights';
import * as dummyTool from './dummy';

export function apply(ctx: Context) {
  ctx.plugin(arknightsTool);
  ctx.plugin(dummyTool);
}
