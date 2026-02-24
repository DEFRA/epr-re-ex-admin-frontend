import { describe, it, expect, vi } from 'vitest'
import { createAppendMenuItems } from './jsoneditor.context-menu.js'

describe('createAppendMenuItems', () => {
  const registrationTemplate = {
    id: null,
    status: null,
    registrationNumber: null,
    site: { address: { line1: null, postcode: null }, gridReference: null }
  }

  const accreditationTemplate = {
    id: null,
    status: null,
    accreditationNumber: null
  }

  const appendableArrays = [
    {
      path: ['registrations'],
      label: 'Add registration',
      template: registrationTemplate
    },
    {
      path: ['accreditations'],
      label: 'Add accreditation',
      template: accreditationTemplate
    }
  ]

  function createMockEditor(data) {
    return {
      get: vi.fn(() => data),
      update: vi.fn()
    }
  }

  it('should return original items unchanged when path does not match', () => {
    const mockEditor = createMockEditor({})
    const onCreateMenu = createAppendMenuItems(
      appendableArrays,
      () => mockEditor
    )
    const originalItems = [{ text: 'Existing item' }]

    const result = onCreateMenu(originalItems, {
      path: ['users'],
      type: 'single'
    })

    expect(result).toEqual([{ text: 'Existing item' }])
    expect(result).toHaveLength(1)
  })

  it('should add menu item when path matches registrations', () => {
    const mockEditor = createMockEditor({})
    const onCreateMenu = createAppendMenuItems(
      appendableArrays,
      () => mockEditor
    )
    const originalItems = [{ text: 'Existing item' }]

    const result = onCreateMenu(originalItems, {
      path: ['registrations'],
      type: 'single'
    })

    expect(result).toHaveLength(2)
    expect(result[1].text).toBe('Add registration')
  })

  it('should add menu item when path matches accreditations', () => {
    const mockEditor = createMockEditor({})
    const onCreateMenu = createAppendMenuItems(
      appendableArrays,
      () => mockEditor
    )

    const result = onCreateMenu([], {
      path: ['accreditations'],
      type: 'single'
    })

    expect(result).toHaveLength(1)
    expect(result[0].text).toBe('Add accreditation')
  })

  it('should set title matching the label', () => {
    const mockEditor = createMockEditor({})
    const onCreateMenu = createAppendMenuItems(
      appendableArrays,
      () => mockEditor
    )

    const result = onCreateMenu([], {
      path: ['registrations'],
      type: 'single'
    })

    expect(result[0].title).toBe('Add registration')
  })

  it('should set className to jsoneditor-append', () => {
    const mockEditor = createMockEditor({})
    const onCreateMenu = createAppendMenuItems(
      appendableArrays,
      () => mockEditor
    )

    const result = onCreateMenu([], {
      path: ['registrations'],
      type: 'single'
    })

    expect(result[0].className).toBe('jsoneditor-append')
  })

  it('should not match nested paths within a configured array', () => {
    const mockEditor = createMockEditor({})
    const onCreateMenu = createAppendMenuItems(
      appendableArrays,
      () => mockEditor
    )

    const result = onCreateMenu([], {
      path: ['registrations', '0'],
      type: 'single'
    })

    expect(result).toHaveLength(0)
  })

  it('should not match parent paths', () => {
    const mockEditor = createMockEditor({})
    const onCreateMenu = createAppendMenuItems(
      appendableArrays,
      () => mockEditor
    )

    const result = onCreateMenu([], { path: [], type: 'single' })

    expect(result).toHaveLength(0)
  })

  it('should return original items when appendableArrays is empty', () => {
    const mockEditor = createMockEditor({})
    const onCreateMenu = createAppendMenuItems([], () => mockEditor)
    const originalItems = [{ text: 'Existing item' }]

    const result = onCreateMenu(originalItems, {
      path: ['registrations'],
      type: 'single'
    })

    expect(result).toEqual([{ text: 'Existing item' }])
  })

  it('should match when node type is append', () => {
    const mockEditor = createMockEditor({})
    const onCreateMenu = createAppendMenuItems(
      appendableArrays,
      () => mockEditor
    )

    const result = onCreateMenu([], {
      path: ['registrations'],
      type: 'append'
    })

    expect(result).toHaveLength(1)
    expect(result[0].text).toBe('Add registration')
  })

  describe('click handler', () => {
    it('should append a template item to the array', () => {
      const data = { registrations: [{ id: 'existing' }] }
      const mockEditor = createMockEditor(data)
      const onAfterAppend = vi.fn()
      const onCreateMenu = createAppendMenuItems(
        appendableArrays,
        () => mockEditor,
        onAfterAppend
      )

      const result = onCreateMenu([], {
        path: ['registrations'],
        type: 'single'
      })
      result[0].click()

      expect(mockEditor.update).toHaveBeenCalledTimes(1)
      const updatedData = mockEditor.update.mock.calls[0][0]
      expect(updatedData.registrations).toHaveLength(2)
      expect(updatedData.registrations[0]).toEqual({ id: 'existing' })
      expect(updatedData.registrations[1]).toEqual(registrationTemplate)
    })

    it('should call onAfterAppend with the updated data', () => {
      const data = { registrations: [] }
      const mockEditor = createMockEditor(data)
      const onAfterAppend = vi.fn()
      const onCreateMenu = createAppendMenuItems(
        appendableArrays,
        () => mockEditor,
        onAfterAppend
      )

      const result = onCreateMenu([], {
        path: ['registrations'],
        type: 'single'
      })
      result[0].click()

      expect(onAfterAppend).toHaveBeenCalledTimes(1)
      const updatedData = onAfterAppend.mock.calls[0][0]
      expect(updatedData.registrations).toHaveLength(1)
      expect(updatedData.registrations[0]).toEqual(registrationTemplate)
    })

    it('should not call onAfterAppend if path does not resolve to an array', () => {
      const data = { registrations: 'not an array' }
      const mockEditor = createMockEditor(data)
      const onAfterAppend = vi.fn()
      const onCreateMenu = createAppendMenuItems(
        appendableArrays,
        () => mockEditor,
        onAfterAppend
      )

      const result = onCreateMenu([], {
        path: ['registrations'],
        type: 'single'
      })
      result[0].click()

      expect(onAfterAppend).not.toHaveBeenCalled()
    })

    it('should not call onAfterAppend if path resolves to null', () => {
      const data = { registrations: null }
      const mockEditor = createMockEditor(data)
      const onAfterAppend = vi.fn()
      const onCreateMenu = createAppendMenuItems(
        appendableArrays,
        () => mockEditor,
        onAfterAppend
      )

      const result = onCreateMenu([], {
        path: ['registrations'],
        type: 'single'
      })
      result[0].click()

      expect(onAfterAppend).not.toHaveBeenCalled()
    })

    it('should deep clone the data before modifying', () => {
      const originalRegistration = { id: 'existing' }
      const data = { registrations: [originalRegistration] }
      const mockEditor = createMockEditor(data)
      const onCreateMenu = createAppendMenuItems(
        appendableArrays,
        () => mockEditor,
        vi.fn()
      )

      const result = onCreateMenu([], {
        path: ['registrations'],
        type: 'single'
      })
      result[0].click()

      expect(data.registrations).toHaveLength(1)
      expect(originalRegistration).toEqual({ id: 'existing' })
    })

    it('should deep clone the template on each click', () => {
      const data = { registrations: [] }
      const mockEditor = createMockEditor(data)
      const onCreateMenu = createAppendMenuItems(
        appendableArrays,
        () => mockEditor,
        vi.fn()
      )

      const result = onCreateMenu([], {
        path: ['registrations'],
        type: 'single'
      })
      result[0].click()
      result[0].click()

      const firstCall = mockEditor.update.mock.calls[0][0]
      const secondCall = mockEditor.update.mock.calls[1][0]
      expect(firstCall.registrations[0]).not.toBe(secondCall.registrations[0])
    })

    it('should not call update if path does not resolve to an array', () => {
      const data = { registrations: 'not an array' }
      const mockEditor = createMockEditor(data)
      const onCreateMenu = createAppendMenuItems(
        appendableArrays,
        () => mockEditor,
        vi.fn()
      )

      const result = onCreateMenu([], {
        path: ['registrations'],
        type: 'single'
      })
      result[0].click()

      expect(mockEditor.update).not.toHaveBeenCalled()
    })

    it('should not call update if path resolves to null', () => {
      const data = { registrations: null }
      const mockEditor = createMockEditor(data)
      const onCreateMenu = createAppendMenuItems(
        appendableArrays,
        () => mockEditor,
        vi.fn()
      )

      const result = onCreateMenu([], {
        path: ['registrations'],
        type: 'single'
      })
      result[0].click()

      expect(mockEditor.update).not.toHaveBeenCalled()
    })

    it('should append to accreditations array correctly', () => {
      const data = { accreditations: [] }
      const mockEditor = createMockEditor(data)
      const onCreateMenu = createAppendMenuItems(
        appendableArrays,
        () => mockEditor,
        vi.fn()
      )

      const result = onCreateMenu([], {
        path: ['accreditations'],
        type: 'single'
      })
      result[0].click()

      const updatedData = mockEditor.update.mock.calls[0][0]
      expect(updatedData.accreditations).toHaveLength(1)
      expect(updatedData.accreditations[0]).toEqual(accreditationTemplate)
    })
  })
})
