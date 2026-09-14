export async function prepareMedia(assets) {
  const savedAssets = Array.isArray(assets)
    ? assets.map(asset => ({
        ...asset
      }))
    : [];

  return {
    assets: savedAssets,
    rollback: async () => {}
  };
}