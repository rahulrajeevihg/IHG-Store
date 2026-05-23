import { enforceGet, handleAll, setNoStore } from '@/libs/server/salesHome/routeHelpers';

export default async function handler(req, res) {
  setNoStore(res);
  if (!enforceGet(req, res)) return;
  await handleAll(req, res);
}
