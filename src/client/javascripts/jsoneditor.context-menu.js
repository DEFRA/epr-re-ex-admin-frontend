import isEqual from 'lodash/isEqual.js'

/**
 * Creates an onCreateMenu callback that adds "Add" menu items
 * for configured arrays in the JSONEditor context menu.
 * @param {Array} appendableArrays - Array of { path, label, template } configs
 * @param {Function} getEditor - Function that returns the editor instance
 * @param {Function} onAfterAppend - Called with updated data after an item is appended
 * @returns {Function} onCreateMenu callback for JSONEditor
 */
export function createAppendMenuItems(
  appendableArrays,
  getEditor,
  onAfterAppend
) {
  return (items, node) => {
    const matched = appendableArrays.find((config) =>
      isEqual(node.path, config.path)
    )

    if (!matched) {
      return items
    }

    items.push({
      text: matched.label,
      title: matched.label,
      className: 'jsoneditor-append',
      click: () => {
        const editor = getEditor()
        const data = JSON.parse(JSON.stringify(editor.get()))
        const array = matched.path.reduce((obj, key) => obj?.[key], data)

        if (Array.isArray(array)) {
          array.push(JSON.parse(JSON.stringify(matched.template)))
          editor.update(data)
          onAfterAppend?.(data)
        }
      }
    })

    return items
  }
}
