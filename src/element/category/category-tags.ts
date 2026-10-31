export function categoryQueryTags(id: string, categories: Array<{ id: string; tags: Array<string> }>) {
  const category = categories.find(a => a.id === id.replace(/^internal:/, ""))
  return category ? [...category.tags, `internal:${category.id}`] : [id]
}
