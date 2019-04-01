(function () {
    'use strict';

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    const directives = new WeakMap();
    /**
     * Brands a function as a directive so that lit-html will call the function
     * during template rendering, rather than passing as a value.
     *
     * @param f The directive factory function. Must be a function that returns a
     * function of the signature `(part: Part) => void`. The returned function will
     * be called with the part object
     *
     * @example
     *
     * ```
     * import {directive, html} from 'lit-html';
     *
     * const immutable = directive((v) => (part) => {
     *   if (part.value !== v) {
     *     part.setValue(v)
     *   }
     * });
     * ```
     */
    // tslint:disable-next-line:no-any

    const directive = f => (...args) => {
      const d = f(...args);
      directives.set(d, true);
      return d;
    };
    const isDirective = o => {
      return typeof o === 'function' && directives.has(o);
    };

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */

    /**
     * True if the custom elements polyfill is in use.
     */
    const isCEPolyfill = window.customElements !== undefined && window.customElements.polyfillWrapFlushCallback !== undefined;
    /**
     * Removes nodes, starting from `startNode` (inclusive) to `endNode`
     * (exclusive), from `container`.
     */

    const removeNodes = (container, startNode, endNode = null) => {
      let node = startNode;

      while (node !== endNode) {
        const n = node.nextSibling;
        container.removeChild(node);
        node = n;
      }
    };

    /**
     * @license
     * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */

    /**
     * A sentinel value that signals that a value was handled by a directive and
     * should not be written to the DOM.
     */
    const noChange = {};
    /**
     * A sentinel value that signals a NodePart to fully clear its content.
     */

    const nothing = {};

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */

    /**
     * An expression marker with embedded unique key to avoid collision with
     * possible text in templates.
     */
    const marker = `{{lit-${String(Math.random()).slice(2)}}}`;
    /**
     * An expression marker used text-positions, multi-binding attributes, and
     * attributes with markup-like text values.
     */

    const nodeMarker = `<!--${marker}-->`;
    const markerRegex = new RegExp(`${marker}|${nodeMarker}`);
    /**
     * Suffix appended to all bound attribute names.
     */

    const boundAttributeSuffix = '$lit$';
    /**
     * An updateable Template that tracks the location of dynamic parts.
     */

    class Template {
      constructor(result, element) {
        this.parts = [];
        this.element = element;
        let index = -1;
        let partIndex = 0;
        const nodesToRemove = [];

        const _prepareTemplate = template => {
          const content = template.content; // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be
          // null

          const walker = document.createTreeWalker(content, 133
          /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */
          , null, false); // Keeps track of the last index associated with a part. We try to delete
          // unnecessary nodes, but we never want to associate two different parts
          // to the same index. They must have a constant node between.

          let lastPartIndex = 0;

          while (walker.nextNode()) {
            index++;
            const node = walker.currentNode;

            if (node.nodeType === 1
            /* Node.ELEMENT_NODE */
            ) {
                if (node.hasAttributes()) {
                  const attributes = node.attributes; // Per
                  // https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
                  // attributes are not guaranteed to be returned in document order.
                  // In particular, Edge/IE can return them out of order, so we cannot
                  // assume a correspondance between part index and attribute index.

                  let count = 0;

                  for (let i = 0; i < attributes.length; i++) {
                    if (attributes[i].value.indexOf(marker) >= 0) {
                      count++;
                    }
                  }

                  while (count-- > 0) {
                    // Get the template literal section leading up to the first
                    // expression in this attribute
                    const stringForPart = result.strings[partIndex]; // Find the attribute name

                    const name = lastAttributeNameRegex.exec(stringForPart)[2]; // Find the corresponding attribute
                    // All bound attributes have had a suffix added in
                    // TemplateResult#getHTML to opt out of special attribute
                    // handling. To look up the attribute value we also need to add
                    // the suffix.

                    const attributeLookupName = name.toLowerCase() + boundAttributeSuffix;
                    const attributeValue = node.getAttribute(attributeLookupName);
                    const strings = attributeValue.split(markerRegex);
                    this.parts.push({
                      type: 'attribute',
                      index,
                      name,
                      strings
                    });
                    node.removeAttribute(attributeLookupName);
                    partIndex += strings.length - 1;
                  }
                }

                if (node.tagName === 'TEMPLATE') {
                  _prepareTemplate(node);
                }
              } else if (node.nodeType === 3
            /* Node.TEXT_NODE */
            ) {
                const data = node.data;

                if (data.indexOf(marker) >= 0) {
                  const parent = node.parentNode;
                  const strings = data.split(markerRegex);
                  const lastIndex = strings.length - 1; // Generate a new text node for each literal section
                  // These nodes are also used as the markers for node parts

                  for (let i = 0; i < lastIndex; i++) {
                    parent.insertBefore(strings[i] === '' ? createMarker() : document.createTextNode(strings[i]), node);
                    this.parts.push({
                      type: 'node',
                      index: ++index
                    });
                  } // If there's no text, we must insert a comment to mark our place.
                  // Else, we can trust it will stick around after cloning.


                  if (strings[lastIndex] === '') {
                    parent.insertBefore(createMarker(), node);
                    nodesToRemove.push(node);
                  } else {
                    node.data = strings[lastIndex];
                  } // We have a part for each match found


                  partIndex += lastIndex;
                }
              } else if (node.nodeType === 8
            /* Node.COMMENT_NODE */
            ) {
                if (node.data === marker) {
                  const parent = node.parentNode; // Add a new marker node to be the startNode of the Part if any of
                  // the following are true:
                  //  * We don't have a previousSibling
                  //  * The previousSibling is already the start of a previous part

                  if (node.previousSibling === null || index === lastPartIndex) {
                    index++;
                    parent.insertBefore(createMarker(), node);
                  }

                  lastPartIndex = index;
                  this.parts.push({
                    type: 'node',
                    index
                  }); // If we don't have a nextSibling, keep this node so we have an end.
                  // Else, we can remove it to save future costs.

                  if (node.nextSibling === null) {
                    node.data = '';
                  } else {
                    nodesToRemove.push(node);
                    index--;
                  }

                  partIndex++;
                } else {
                  let i = -1;

                  while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
                    // Comment node has a binding marker inside, make an inactive part
                    // The binding won't work, but subsequent bindings will
                    // TODO (justinfagnani): consider whether it's even worth it to
                    // make bindings in comments work
                    this.parts.push({
                      type: 'node',
                      index: -1
                    });
                  }
                }
              }
          }
        };

        _prepareTemplate(element); // Remove text binding nodes after the walk to not disturb the TreeWalker


        for (const n of nodesToRemove) {
          n.parentNode.removeChild(n);
        }
      }

    }
    const isTemplatePartActive = part => part.index !== -1; // Allows `document.createComment('')` to be renamed for a
    // small manual size-savings.

    const createMarker = () => document.createComment('');
    /**
     * This regex extracts the attribute name preceding an attribute-position
     * expression. It does this by matching the syntax allowed for attributes
     * against the string literal directly preceding the expression, assuming that
     * the expression is in an attribute-value position.
     *
     * See attributes in the HTML spec:
     * https://www.w3.org/TR/html5/syntax.html#attributes-0
     *
     * "\0-\x1F\x7F-\x9F" are Unicode control characters
     *
     * " \x09\x0a\x0c\x0d" are HTML space characters:
     * https://www.w3.org/TR/html5/infrastructure.html#space-character
     *
     * So an attribute is:
     *  * The name: any character except a control character, space character, ('),
     *    ("), ">", "=", or "/"
     *  * Followed by zero or more space characters
     *  * Followed by "="
     *  * Followed by zero or more space characters
     *  * Followed by:
     *    * Any character except space, ('), ("), "<", ">", "=", (`), or
     *    * (") then any non-("), or
     *    * (') then any non-(')
     */

    const lastAttributeNameRegex = /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F \x09\x0a\x0c\x0d"'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * An instance of a `Template` that can be attached to the DOM and updated
     * with new values.
     */

    class TemplateInstance {
      constructor(template, processor, options) {
        this._parts = [];
        this.template = template;
        this.processor = processor;
        this.options = options;
      }

      update(values) {
        let i = 0;

        for (const part of this._parts) {
          if (part !== undefined) {
            part.setValue(values[i]);
          }

          i++;
        }

        for (const part of this._parts) {
          if (part !== undefined) {
            part.commit();
          }
        }
      }

      _clone() {
        // When using the Custom Elements polyfill, clone the node, rather than
        // importing it, to keep the fragment in the template's document. This
        // leaves the fragment inert so custom elements won't upgrade and
        // potentially modify their contents by creating a polyfilled ShadowRoot
        // while we traverse the tree.
        const fragment = isCEPolyfill ? this.template.element.content.cloneNode(true) : document.importNode(this.template.element.content, true);
        const parts = this.template.parts;
        let partIndex = 0;
        let nodeIndex = 0;

        const _prepareInstance = fragment => {
          // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be
          // null
          const walker = document.createTreeWalker(fragment, 133
          /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */
          , null, false);
          let node = walker.nextNode(); // Loop through all the nodes and parts of a template

          while (partIndex < parts.length && node !== null) {
            const part = parts[partIndex]; // Consecutive Parts may have the same node index, in the case of
            // multiple bound attributes on an element. So each iteration we either
            // increment the nodeIndex, if we aren't on a node with a part, or the
            // partIndex if we are. By not incrementing the nodeIndex when we find a
            // part, we allow for the next part to be associated with the current
            // node if neccessasry.

            if (!isTemplatePartActive(part)) {
              this._parts.push(undefined);

              partIndex++;
            } else if (nodeIndex === part.index) {
              if (part.type === 'node') {
                const part = this.processor.handleTextExpression(this.options);
                part.insertAfterNode(node.previousSibling);

                this._parts.push(part);
              } else {
                this._parts.push(...this.processor.handleAttributeExpressions(node, part.name, part.strings, this.options));
              }

              partIndex++;
            } else {
              nodeIndex++;

              if (node.nodeName === 'TEMPLATE') {
                _prepareInstance(node.content);
              }

              node = walker.nextNode();
            }
          }
        };

        _prepareInstance(fragment);

        if (isCEPolyfill) {
          document.adoptNode(fragment);
          customElements.upgrade(fragment);
        }

        return fragment;
      }

    }

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * The return type of `html`, which holds a Template and the values from
     * interpolated expressions.
     */

    class TemplateResult {
      constructor(strings, values, type, processor) {
        this.strings = strings;
        this.values = values;
        this.type = type;
        this.processor = processor;
      }
      /**
       * Returns a string of HTML used to create a `<template>` element.
       */


      getHTML() {
        const endIndex = this.strings.length - 1;
        let html = '';

        for (let i = 0; i < endIndex; i++) {
          const s = this.strings[i]; // This exec() call does two things:
          // 1) Appends a suffix to the bound attribute name to opt out of special
          // attribute value parsing that IE11 and Edge do, like for style and
          // many SVG attributes. The Template class also appends the same suffix
          // when looking up attributes to create Parts.
          // 2) Adds an unquoted-attribute-safe marker for the first expression in
          // an attribute. Subsequent attribute expressions will use node markers,
          // and this is safe since attributes with multiple expressions are
          // guaranteed to be quoted.

          const match = lastAttributeNameRegex.exec(s);

          if (match) {
            // We're starting a new bound attribute.
            // Add the safe attribute suffix, and use unquoted-attribute-safe
            // marker.
            html += s.substr(0, match.index) + match[1] + match[2] + boundAttributeSuffix + match[3] + marker;
          } else {
            // We're either in a bound node, or trailing bound attribute.
            // Either way, nodeMarker is safe to use.
            html += s + nodeMarker;
          }
        }

        return html + this.strings[endIndex];
      }

      getTemplateElement() {
        const template = document.createElement('template');
        template.innerHTML = this.getHTML();
        return template;
      }

    }

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    const isPrimitive = value => {
      return value === null || !(typeof value === 'object' || typeof value === 'function');
    };
    /**
     * Sets attribute values for AttributeParts, so that the value is only set once
     * even if there are multiple parts for an attribute.
     */

    class AttributeCommitter {
      constructor(element, name, strings) {
        this.dirty = true;
        this.element = element;
        this.name = name;
        this.strings = strings;
        this.parts = [];

        for (let i = 0; i < strings.length - 1; i++) {
          this.parts[i] = this._createPart();
        }
      }
      /**
       * Creates a single part. Override this to create a differnt type of part.
       */


      _createPart() {
        return new AttributePart(this);
      }

      _getValue() {
        const strings = this.strings;
        const l = strings.length - 1;
        let text = '';

        for (let i = 0; i < l; i++) {
          text += strings[i];
          const part = this.parts[i];

          if (part !== undefined) {
            const v = part.value;

            if (v != null && (Array.isArray(v) || // tslint:disable-next-line:no-any
            typeof v !== 'string' && v[Symbol.iterator])) {
              for (const t of v) {
                text += typeof t === 'string' ? t : String(t);
              }
            } else {
              text += typeof v === 'string' ? v : String(v);
            }
          }
        }

        text += strings[l];
        return text;
      }

      commit() {
        if (this.dirty) {
          this.dirty = false;
          this.element.setAttribute(this.name, this._getValue());
        }
      }

    }
    class AttributePart {
      constructor(comitter) {
        this.value = undefined;
        this.committer = comitter;
      }

      setValue(value) {
        if (value !== noChange && (!isPrimitive(value) || value !== this.value)) {
          this.value = value; // If the value is a not a directive, dirty the committer so that it'll
          // call setAttribute. If the value is a directive, it'll dirty the
          // committer if it calls setValue().

          if (!isDirective(value)) {
            this.committer.dirty = true;
          }
        }
      }

      commit() {
        while (isDirective(this.value)) {
          const directive$$1 = this.value;
          this.value = noChange;
          directive$$1(this);
        }

        if (this.value === noChange) {
          return;
        }

        this.committer.commit();
      }

    }
    class NodePart {
      constructor(options) {
        this.value = undefined;
        this._pendingValue = undefined;
        this.options = options;
      }
      /**
       * Inserts this part into a container.
       *
       * This part must be empty, as its contents are not automatically moved.
       */


      appendInto(container) {
        this.startNode = container.appendChild(createMarker());
        this.endNode = container.appendChild(createMarker());
      }
      /**
       * Inserts this part between `ref` and `ref`'s next sibling. Both `ref` and
       * its next sibling must be static, unchanging nodes such as those that appear
       * in a literal section of a template.
       *
       * This part must be empty, as its contents are not automatically moved.
       */


      insertAfterNode(ref) {
        this.startNode = ref;
        this.endNode = ref.nextSibling;
      }
      /**
       * Appends this part into a parent part.
       *
       * This part must be empty, as its contents are not automatically moved.
       */


      appendIntoPart(part) {
        part._insert(this.startNode = createMarker());

        part._insert(this.endNode = createMarker());
      }
      /**
       * Appends this part after `ref`
       *
       * This part must be empty, as its contents are not automatically moved.
       */


      insertAfterPart(ref) {
        ref._insert(this.startNode = createMarker());

        this.endNode = ref.endNode;
        ref.endNode = this.startNode;
      }

      setValue(value) {
        this._pendingValue = value;
      }

      commit() {
        while (isDirective(this._pendingValue)) {
          const directive$$1 = this._pendingValue;
          this._pendingValue = noChange;
          directive$$1(this);
        }

        const value = this._pendingValue;

        if (value === noChange) {
          return;
        }

        if (isPrimitive(value)) {
          if (value !== this.value) {
            this._commitText(value);
          }
        } else if (value instanceof TemplateResult) {
          this._commitTemplateResult(value);
        } else if (value instanceof Node) {
          this._commitNode(value);
        } else if (Array.isArray(value) || // tslint:disable-next-line:no-any
        value[Symbol.iterator]) {
          this._commitIterable(value);
        } else if (value === nothing) {
          this.value = nothing;
          this.clear();
        } else {
          // Fallback, will render the string representation
          this._commitText(value);
        }
      }

      _insert(node) {
        this.endNode.parentNode.insertBefore(node, this.endNode);
      }

      _commitNode(value) {
        if (this.value === value) {
          return;
        }

        this.clear();

        this._insert(value);

        this.value = value;
      }

      _commitText(value) {
        const node = this.startNode.nextSibling;
        value = value == null ? '' : value;

        if (node === this.endNode.previousSibling && node.nodeType === 3
        /* Node.TEXT_NODE */
        ) {
            // If we only have a single text node between the markers, we can just
            // set its value, rather than replacing it.
            // TODO(justinfagnani): Can we just check if this.value is primitive?
            node.data = value;
          } else {
          this._commitNode(document.createTextNode(typeof value === 'string' ? value : String(value)));
        }

        this.value = value;
      }

      _commitTemplateResult(value) {
        const template = this.options.templateFactory(value);

        if (this.value instanceof TemplateInstance && this.value.template === template) {
          this.value.update(value.values);
        } else {
          // Make sure we propagate the template processor from the TemplateResult
          // so that we use its syntax extension, etc. The template factory comes
          // from the render function options so that it can control template
          // caching and preprocessing.
          const instance = new TemplateInstance(template, value.processor, this.options);

          const fragment = instance._clone();

          instance.update(value.values);

          this._commitNode(fragment);

          this.value = instance;
        }
      }

      _commitIterable(value) {
        // For an Iterable, we create a new InstancePart per item, then set its
        // value to the item. This is a little bit of overhead for every item in
        // an Iterable, but it lets us recurse easily and efficiently update Arrays
        // of TemplateResults that will be commonly returned from expressions like:
        // array.map((i) => html`${i}`), by reusing existing TemplateInstances.
        // If _value is an array, then the previous render was of an
        // iterable and _value will contain the NodeParts from the previous
        // render. If _value is not an array, clear this part and make a new
        // array for NodeParts.
        if (!Array.isArray(this.value)) {
          this.value = [];
          this.clear();
        } // Lets us keep track of how many items we stamped so we can clear leftover
        // items from a previous render


        const itemParts = this.value;
        let partIndex = 0;
        let itemPart;

        for (const item of value) {
          // Try to reuse an existing part
          itemPart = itemParts[partIndex]; // If no existing part, create a new one

          if (itemPart === undefined) {
            itemPart = new NodePart(this.options);
            itemParts.push(itemPart);

            if (partIndex === 0) {
              itemPart.appendIntoPart(this);
            } else {
              itemPart.insertAfterPart(itemParts[partIndex - 1]);
            }
          }

          itemPart.setValue(item);
          itemPart.commit();
          partIndex++;
        }

        if (partIndex < itemParts.length) {
          // Truncate the parts array so _value reflects the current state
          itemParts.length = partIndex;
          this.clear(itemPart && itemPart.endNode);
        }
      }

      clear(startNode = this.startNode) {
        removeNodes(this.startNode.parentNode, startNode.nextSibling, this.endNode);
      }

    }
    /**
     * Implements a boolean attribute, roughly as defined in the HTML
     * specification.
     *
     * If the value is truthy, then the attribute is present with a value of
     * ''. If the value is falsey, the attribute is removed.
     */

    class BooleanAttributePart {
      constructor(element, name, strings) {
        this.value = undefined;
        this._pendingValue = undefined;

        if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
          throw new Error('Boolean attributes can only contain a single expression');
        }

        this.element = element;
        this.name = name;
        this.strings = strings;
      }

      setValue(value) {
        this._pendingValue = value;
      }

      commit() {
        while (isDirective(this._pendingValue)) {
          const directive$$1 = this._pendingValue;
          this._pendingValue = noChange;
          directive$$1(this);
        }

        if (this._pendingValue === noChange) {
          return;
        }

        const value = !!this._pendingValue;

        if (this.value !== value) {
          if (value) {
            this.element.setAttribute(this.name, '');
          } else {
            this.element.removeAttribute(this.name);
          }
        }

        this.value = value;
        this._pendingValue = noChange;
      }

    }
    /**
     * Sets attribute values for PropertyParts, so that the value is only set once
     * even if there are multiple parts for a property.
     *
     * If an expression controls the whole property value, then the value is simply
     * assigned to the property under control. If there are string literals or
     * multiple expressions, then the strings are expressions are interpolated into
     * a string first.
     */

    class PropertyCommitter extends AttributeCommitter {
      constructor(element, name, strings) {
        super(element, name, strings);
        this.single = strings.length === 2 && strings[0] === '' && strings[1] === '';
      }

      _createPart() {
        return new PropertyPart(this);
      }

      _getValue() {
        if (this.single) {
          return this.parts[0].value;
        }

        return super._getValue();
      }

      commit() {
        if (this.dirty) {
          this.dirty = false; // tslint:disable-next-line:no-any

          this.element[this.name] = this._getValue();
        }
      }

    }
    class PropertyPart extends AttributePart {} // Detect event listener options support. If the `capture` property is read
    // from the options object, then options are supported. If not, then the thrid
    // argument to add/removeEventListener is interpreted as the boolean capture
    // value so we should only pass the `capture` property.

    let eventOptionsSupported = false;

    try {
      const options = {
        get capture() {
          eventOptionsSupported = true;
          return false;
        }

      }; // tslint:disable-next-line:no-any

      window.addEventListener('test', options, options); // tslint:disable-next-line:no-any

      window.removeEventListener('test', options, options);
    } catch (_e) {}

    class EventPart {
      constructor(element, eventName, eventContext) {
        this.value = undefined;
        this._pendingValue = undefined;
        this.element = element;
        this.eventName = eventName;
        this.eventContext = eventContext;

        this._boundHandleEvent = e => this.handleEvent(e);
      }

      setValue(value) {
        this._pendingValue = value;
      }

      commit() {
        while (isDirective(this._pendingValue)) {
          const directive$$1 = this._pendingValue;
          this._pendingValue = noChange;
          directive$$1(this);
        }

        if (this._pendingValue === noChange) {
          return;
        }

        const newListener = this._pendingValue;
        const oldListener = this.value;
        const shouldRemoveListener = newListener == null || oldListener != null && (newListener.capture !== oldListener.capture || newListener.once !== oldListener.once || newListener.passive !== oldListener.passive);
        const shouldAddListener = newListener != null && (oldListener == null || shouldRemoveListener);

        if (shouldRemoveListener) {
          this.element.removeEventListener(this.eventName, this._boundHandleEvent, this._options);
        }

        if (shouldAddListener) {
          this._options = getOptions(newListener);
          this.element.addEventListener(this.eventName, this._boundHandleEvent, this._options);
        }

        this.value = newListener;
        this._pendingValue = noChange;
      }

      handleEvent(event) {
        if (typeof this.value === 'function') {
          this.value.call(this.eventContext || this.element, event);
        } else {
          this.value.handleEvent(event);
        }
      }

    } // We copy options because of the inconsistent behavior of browsers when reading
    // the third argument of add/removeEventListener. IE11 doesn't support options
    // at all. Chrome 41 only reads `capture` if the argument is an object.

    const getOptions = o => o && (eventOptionsSupported ? {
      capture: o.capture,
      passive: o.passive,
      once: o.once
    } : o.capture);

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * Creates Parts when a template is instantiated.
     */

    class DefaultTemplateProcessor {
      /**
       * Create parts for an attribute-position binding, given the event, attribute
       * name, and string literals.
       *
       * @param element The element containing the binding
       * @param name  The attribute name
       * @param strings The string literals. There are always at least two strings,
       *   event for fully-controlled bindings with a single expression.
       */
      handleAttributeExpressions(element, name, strings, options) {
        const prefix = name[0];

        if (prefix === '.') {
          const comitter = new PropertyCommitter(element, name.slice(1), strings);
          return comitter.parts;
        }

        if (prefix === '@') {
          return [new EventPart(element, name.slice(1), options.eventContext)];
        }

        if (prefix === '?') {
          return [new BooleanAttributePart(element, name.slice(1), strings)];
        }

        const comitter = new AttributeCommitter(element, name, strings);
        return comitter.parts;
      }
      /**
       * Create parts for a text-position binding.
       * @param templateFactory
       */


      handleTextExpression(options) {
        return new NodePart(options);
      }

    }
    const defaultTemplateProcessor = new DefaultTemplateProcessor();

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * The default TemplateFactory which caches Templates keyed on
     * result.type and result.strings.
     */

    function templateFactory(result) {
      let templateCache = templateCaches.get(result.type);

      if (templateCache === undefined) {
        templateCache = {
          stringsArray: new WeakMap(),
          keyString: new Map()
        };
        templateCaches.set(result.type, templateCache);
      }

      let template = templateCache.stringsArray.get(result.strings);

      if (template !== undefined) {
        return template;
      } // If the TemplateStringsArray is new, generate a key from the strings
      // This key is shared between all templates with identical content


      const key = result.strings.join(marker); // Check if we already have a Template for this key

      template = templateCache.keyString.get(key);

      if (template === undefined) {
        // If we have not seen this key before, create a new Template
        template = new Template(result, result.getTemplateElement()); // Cache the Template for this key

        templateCache.keyString.set(key, template);
      } // Cache all future queries for this TemplateStringsArray


      templateCache.stringsArray.set(result.strings, template);
      return template;
    }
    const templateCaches = new Map();

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    const parts = new WeakMap();
    /**
     * Renders a template to a container.
     *
     * To update a container with new values, reevaluate the template literal and
     * call `render` with the new result.
     *
     * @param result a TemplateResult created by evaluating a template tag like
     *     `html` or `svg`.
     * @param container A DOM parent to render to. The entire contents are either
     *     replaced, or efficiently updated if the same result type was previous
     *     rendered there.
     * @param options RenderOptions for the entire render tree rendered to this
     *     container. Render options must *not* change between renders to the same
     *     container, as those changes will not effect previously rendered DOM.
     */

    const render = (result, container, options) => {
      let part = parts.get(container);

      if (part === undefined) {
        removeNodes(container, container.firstChild);
        parts.set(container, part = new NodePart(Object.assign({
          templateFactory
        }, options)));
        part.appendInto(container);
      }

      part.setValue(result);
      part.commit();
    };

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    // This line will be used in regexes to search for lit-html usage.
    // TODO(justinfagnani): inject version number at build time

    (window['litHtmlVersions'] || (window['litHtmlVersions'] = [])).push('1.0.0');
    /**
     * Interprets a template literal as an HTML template that can efficiently
     * render to and update a container.
     */

    const html = (strings, ...values) => new TemplateResult(strings, values, 'html', defaultTemplateProcessor);

    /** MobX - (c) Michel Weststrate 2015 - 2018 - MIT Licensed */

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    /* global Reflect, Promise */
    var extendStatics = Object.setPrototypeOf || {
      __proto__: []
    } instanceof Array && function (d, b) {
      d.__proto__ = b;
    } || function (d, b) {
      for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    };

    function __extends(d, b) {
      extendStatics(d, b);

      function __() {
        this.constructor = d;
      }

      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = Object.assign || function __assign(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];

        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
      }

      return t;
    };

    function __values(o) {
      var m = typeof Symbol === "function" && o[Symbol.iterator],
          i = 0;
      if (m) return m.call(o);
      return {
        next: function () {
          if (o && i >= o.length) o = void 0;
          return {
            value: o && o[i++],
            done: !o
          };
        }
      };
    }

    function __read(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o),
          r,
          ar = [],
          e;

      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = {
          error: error
        };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }

      return ar;
    }

    function __spread() {
      for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));

      return ar;
    }

    var OBFUSCATED_ERROR$$1 = "An invariant failed, however the error is obfuscated because this is an production build.";
    var EMPTY_ARRAY$$1 = [];
    Object.freeze(EMPTY_ARRAY$$1);
    var EMPTY_OBJECT$$1 = {};
    Object.freeze(EMPTY_OBJECT$$1);

    function getNextId$$1() {
      return ++globalState$$1.mobxGuid;
    }

    function fail$$1(message) {
      invariant$$1(false, message);
      throw "X"; // unreachable
    }

    function invariant$$1(check, message) {
      if (!check) throw new Error("[mobx] " + (message || OBFUSCATED_ERROR$$1));
    }
    /**
     * Makes sure that the provided function is invoked at most once.
     */


    function once$$1(func) {
      var invoked = false;
      return function () {
        if (invoked) return;
        invoked = true;
        return func.apply(this, arguments);
      };
    }

    var noop$$1 = function () {};

    function unique$$1(list) {
      var res = [];
      list.forEach(function (item) {
        if (res.indexOf(item) === -1) res.push(item);
      });
      return res;
    }

    function isObject$$1(value) {
      return value !== null && typeof value === "object";
    }

    function isPlainObject$$1(value) {
      if (value === null || typeof value !== "object") return false;
      var proto = Object.getPrototypeOf(value);
      return proto === Object.prototype || proto === null;
    }

    function addHiddenProp$$1(object, propName, value) {
      Object.defineProperty(object, propName, {
        enumerable: false,
        writable: true,
        configurable: true,
        value: value
      });
    }

    function addHiddenFinalProp$$1(object, propName, value) {
      Object.defineProperty(object, propName, {
        enumerable: false,
        writable: false,
        configurable: true,
        value: value
      });
    }

    function isPropertyConfigurable$$1(object, prop) {
      var descriptor = Object.getOwnPropertyDescriptor(object, prop);
      return !descriptor || descriptor.configurable !== false && descriptor.writable !== false;
    }

    function assertPropertyConfigurable$$1(object, prop) {
      if (process.env.NODE_ENV !== "production" && !isPropertyConfigurable$$1(object, prop)) fail$$1("Cannot make property '" + prop.toString() + "' observable, it is not configurable and writable in the target object");
    }

    function createInstanceofPredicate$$1(name, clazz) {
      var propName = "isMobX" + name;
      clazz.prototype[propName] = true;
      return function (x) {
        return isObject$$1(x) && x[propName] === true;
      };
    }

    function isES6Map$$1(thing) {
      return thing instanceof Map;
    }

    function isES6Set$$1(thing) {
      return thing instanceof Set;
    }

    function getMapLikeKeys$$1(map) {
      if (isPlainObject$$1(map)) return Object.keys(map);
      if (Array.isArray(map)) return map.map(function (_a) {
        var _b = __read(_a, 1),
            key = _b[0];

        return key;
      });
      if (isES6Map$$1(map) || isObservableMap$$1(map)) return Array.from(map.keys());
      return fail$$1("Cannot get keys from '" + map + "'");
    }

    function toPrimitive$$1(value) {
      return value === null ? null : typeof value === "object" ? "" + value : value;
    }

    var $mobx$$1 = Symbol("mobx administration");

    var Atom$$1 =
    /** @class */
    function () {
      /**
       * Create a new atom. For debugging purposes it is recommended to give it a name.
       * The onBecomeObserved and onBecomeUnobserved callbacks can be used for resource management.
       */
      function Atom$$1(name) {
        if (name === void 0) {
          name = "Atom@" + getNextId$$1();
        }

        this.name = name;
        this.isPendingUnobservation = false; // for effective unobserving. BaseAtom has true, for extra optimization, so its onBecomeUnobserved never gets called, because it's not needed

        this.isBeingObserved = false;
        this.observers = new Set();
        this.diffValue = 0;
        this.lastAccessedBy = 0;
        this.lowestObserverState = IDerivationState.NOT_TRACKING;
      }

      Atom$$1.prototype.onBecomeObserved = function () {
        if (this.onBecomeObservedListeners) {
          this.onBecomeObservedListeners.forEach(function (listener) {
            return listener();
          });
        }
      };

      Atom$$1.prototype.onBecomeUnobserved = function () {
        if (this.onBecomeUnobservedListeners) {
          this.onBecomeUnobservedListeners.forEach(function (listener) {
            return listener();
          });
        }
      };
      /**
       * Invoke this method to notify mobx that your atom has been used somehow.
       * Returns true if there is currently a reactive context.
       */


      Atom$$1.prototype.reportObserved = function () {
        return reportObserved$$1(this);
      };
      /**
       * Invoke this method _after_ this method has changed to signal mobx that all its observers should invalidate.
       */


      Atom$$1.prototype.reportChanged = function () {
        startBatch$$1();
        propagateChanged$$1(this);
        endBatch$$1();
      };

      Atom$$1.prototype.toString = function () {
        return this.name;
      };

      return Atom$$1;
    }();

    var isAtom$$1 = createInstanceofPredicate$$1("Atom", Atom$$1);

    function createAtom$$1(name, onBecomeObservedHandler, onBecomeUnobservedHandler) {
      if (onBecomeObservedHandler === void 0) {
        onBecomeObservedHandler = noop$$1;
      }

      if (onBecomeUnobservedHandler === void 0) {
        onBecomeUnobservedHandler = noop$$1;
      }

      var atom = new Atom$$1(name); // default `noop` listener will not initialize the hook Set

      if (onBecomeObservedHandler !== noop$$1) {
        onBecomeObserved$$1(atom, onBecomeObservedHandler);
      }

      if (onBecomeUnobservedHandler !== noop$$1) {
        onBecomeUnobserved$$1(atom, onBecomeUnobservedHandler);
      }

      return atom;
    }

    function identityComparer(a, b) {
      return a === b;
    }

    function structuralComparer(a, b) {
      return deepEqual$$1(a, b);
    }

    function defaultComparer(a, b) {
      return Object.is(a, b);
    }

    var comparer$$1 = {
      identity: identityComparer,
      structural: structuralComparer,
      default: defaultComparer
    };
    var mobxDidRunLazyInitializersSymbol$$1 = Symbol("mobx did run lazy initializers");
    var mobxPendingDecorators$$1 = Symbol("mobx pending decorators");
    var enumerableDescriptorCache = {};
    var nonEnumerableDescriptorCache = {};

    function createPropertyInitializerDescriptor(prop, enumerable) {
      var cache = enumerable ? enumerableDescriptorCache : nonEnumerableDescriptorCache;
      return cache[prop] || (cache[prop] = {
        configurable: true,
        enumerable: enumerable,
        get: function () {
          initializeInstance$$1(this);
          return this[prop];
        },
        set: function (value) {
          initializeInstance$$1(this);
          this[prop] = value;
        }
      });
    }

    function initializeInstance$$1(target) {
      if (target[mobxDidRunLazyInitializersSymbol$$1] === true) return;
      var decorators = target[mobxPendingDecorators$$1];

      if (decorators) {
        addHiddenProp$$1(target, mobxDidRunLazyInitializersSymbol$$1, true);

        for (var key in decorators) {
          var d = decorators[key];
          d.propertyCreator(target, d.prop, d.descriptor, d.decoratorTarget, d.decoratorArguments);
        }
      }
    }

    function createPropDecorator$$1(propertyInitiallyEnumerable, propertyCreator) {
      return function decoratorFactory() {
        var decoratorArguments;

        var decorator = function decorate$$1(target, prop, descriptor, applyImmediately // This is a special parameter to signal the direct application of a decorator, allow extendObservable to skip the entire type decoration part,
        // as the instance to apply the decorator to equals the target
        ) {
          if (applyImmediately === true) {
            propertyCreator(target, prop, descriptor, target, decoratorArguments);
            return null;
          }

          if (process.env.NODE_ENV !== "production" && !quacksLikeADecorator$$1(arguments)) fail$$1("This function is a decorator, but it wasn't invoked like a decorator");

          if (!Object.prototype.hasOwnProperty.call(target, mobxPendingDecorators$$1)) {
            var inheritedDecorators = target[mobxPendingDecorators$$1];
            addHiddenProp$$1(target, mobxPendingDecorators$$1, __assign({}, inheritedDecorators));
          }

          target[mobxPendingDecorators$$1][prop] = {
            prop: prop,
            propertyCreator: propertyCreator,
            descriptor: descriptor,
            decoratorTarget: target,
            decoratorArguments: decoratorArguments
          };
          return createPropertyInitializerDescriptor(prop, propertyInitiallyEnumerable);
        };

        if (quacksLikeADecorator$$1(arguments)) {
          // @decorator
          decoratorArguments = EMPTY_ARRAY$$1;
          return decorator.apply(null, arguments);
        } else {
          // @decorator(args)
          decoratorArguments = Array.prototype.slice.call(arguments);
          return decorator;
        }
      };
    }

    function quacksLikeADecorator$$1(args) {
      return (args.length === 2 || args.length === 3) && typeof args[1] === "string" || args.length === 4 && args[3] === true;
    }

    function deepEnhancer$$1(v, _, name) {
      // it is an observable already, done
      if (isObservable$$1(v)) return v; // something that can be converted and mutated?

      if (Array.isArray(v)) return observable$$1.array(v, {
        name: name
      });
      if (isPlainObject$$1(v)) return observable$$1.object(v, undefined, {
        name: name
      });
      if (isES6Map$$1(v)) return observable$$1.map(v, {
        name: name
      });
      if (isES6Set$$1(v)) return observable$$1.set(v, {
        name: name
      });
      return v;
    }

    function shallowEnhancer$$1(v, _, name) {
      if (v === undefined || v === null) return v;
      if (isObservableObject$$1(v) || isObservableArray$$1(v) || isObservableMap$$1(v) || isObservableSet$$1(v)) return v;
      if (Array.isArray(v)) return observable$$1.array(v, {
        name: name,
        deep: false
      });
      if (isPlainObject$$1(v)) return observable$$1.object(v, undefined, {
        name: name,
        deep: false
      });
      if (isES6Map$$1(v)) return observable$$1.map(v, {
        name: name,
        deep: false
      });
      if (isES6Set$$1(v)) return observable$$1.set(v, {
        name: name,
        deep: false
      });
      return fail$$1(process.env.NODE_ENV !== "production" && "The shallow modifier / decorator can only used in combination with arrays, objects, maps and sets");
    }

    function referenceEnhancer$$1(newValue) {
      // never turn into an observable
      return newValue;
    }

    function refStructEnhancer$$1(v, oldValue, name) {
      if (process.env.NODE_ENV !== "production" && isObservable$$1(v)) throw "observable.struct should not be used with observable values";
      if (deepEqual$$1(v, oldValue)) return oldValue;
      return v;
    }

    function createDecoratorForEnhancer$$1(enhancer) {
      invariant$$1(enhancer);
      var decorator = createPropDecorator$$1(true, function (target, propertyName, descriptor, _decoratorTarget, decoratorArgs) {
        if (process.env.NODE_ENV !== "production") {
          invariant$$1(!descriptor || !descriptor.get, "@observable cannot be used on getter (property \"" + propertyName + "\"), use @computed instead.");
        }

        var initialValue = descriptor ? descriptor.initializer ? descriptor.initializer.call(target) : descriptor.value : undefined;
        asObservableObject$$1(target).addObservableProp(propertyName, initialValue, enhancer);
      });
      var res = // Extra process checks, as this happens during module initialization
      typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" ? function observableDecorator() {
        // This wrapper function is just to detect illegal decorator invocations, deprecate in a next version
        // and simply return the created prop decorator
        if (arguments.length < 2) return fail$$1("Incorrect decorator invocation. @observable decorator doesn't expect any arguments");
        return decorator.apply(null, arguments);
      } : decorator;
      res.enhancer = enhancer;
      return res;
    } // Predefined bags of create observable options, to avoid allocating temporarily option objects
    // in the majority of cases


    var defaultCreateObservableOptions$$1 = {
      deep: true,
      name: undefined,
      defaultDecorator: undefined,
      proxy: true
    };
    Object.freeze(defaultCreateObservableOptions$$1);

    function assertValidOption(key) {
      if (!/^(deep|name|equals|defaultDecorator|proxy)$/.test(key)) fail$$1("invalid option for (extend)observable: " + key);
    }

    function asCreateObservableOptions$$1(thing) {
      if (thing === null || thing === undefined) return defaultCreateObservableOptions$$1;
      if (typeof thing === "string") return {
        name: thing,
        deep: true,
        proxy: true
      };

      if (process.env.NODE_ENV !== "production") {
        if (typeof thing !== "object") return fail$$1("expected options object");
        Object.keys(thing).forEach(assertValidOption);
      }

      return thing;
    }

    var deepDecorator$$1 = createDecoratorForEnhancer$$1(deepEnhancer$$1);
    var shallowDecorator = createDecoratorForEnhancer$$1(shallowEnhancer$$1);
    var refDecorator$$1 = createDecoratorForEnhancer$$1(referenceEnhancer$$1);
    var refStructDecorator = createDecoratorForEnhancer$$1(refStructEnhancer$$1);

    function getEnhancerFromOptions(options) {
      return options.defaultDecorator ? options.defaultDecorator.enhancer : options.deep === false ? referenceEnhancer$$1 : deepEnhancer$$1;
    }
    /**
     * Turns an object, array or function into a reactive structure.
     * @param v the value which should become observable.
     */


    function createObservable(v, arg2, arg3) {
      // @observable someProp;
      if (typeof arguments[1] === "string") {
        return deepDecorator$$1.apply(null, arguments);
      } // it is an observable already, done


      if (isObservable$$1(v)) return v; // something that can be converted and mutated?

      var res = isPlainObject$$1(v) ? observable$$1.object(v, arg2, arg3) : Array.isArray(v) ? observable$$1.array(v, arg2) : isES6Map$$1(v) ? observable$$1.map(v, arg2) : isES6Set$$1(v) ? observable$$1.set(v, arg2) : v; // this value could be converted to a new observable data structure, return it

      if (res !== v) return res; // otherwise, just box it

      fail$$1(process.env.NODE_ENV !== "production" && "The provided value could not be converted into an observable. If you want just create an observable reference to the object use 'observable.box(value)'");
    }

    var observableFactories = {
      box: function (value, options) {
        if (arguments.length > 2) incorrectlyUsedAsDecorator("box");
        var o = asCreateObservableOptions$$1(options);
        return new ObservableValue$$1(value, getEnhancerFromOptions(o), o.name, true, o.equals);
      },
      array: function (initialValues, options) {
        if (arguments.length > 2) incorrectlyUsedAsDecorator("array");
        var o = asCreateObservableOptions$$1(options);
        return createObservableArray$$1(initialValues, getEnhancerFromOptions(o), o.name);
      },
      map: function (initialValues, options) {
        if (arguments.length > 2) incorrectlyUsedAsDecorator("map");
        var o = asCreateObservableOptions$$1(options);
        return new ObservableMap$$1(initialValues, getEnhancerFromOptions(o), o.name);
      },
      set: function (initialValues, options) {
        if (arguments.length > 2) incorrectlyUsedAsDecorator("set");
        var o = asCreateObservableOptions$$1(options);
        return new ObservableSet$$1(initialValues, getEnhancerFromOptions(o), o.name);
      },
      object: function (props, decorators, options) {
        if (typeof arguments[1] === "string") incorrectlyUsedAsDecorator("object");
        var o = asCreateObservableOptions$$1(options);

        if (o.proxy === false) {
          return extendObservable$$1({}, props, decorators, o);
        } else {
          var defaultDecorator = getDefaultDecoratorFromObjectOptions$$1(o);
          var base = extendObservable$$1({}, undefined, undefined, o);
          var proxy = createDynamicObservableObject$$1(base);
          extendObservableObjectWithProperties$$1(proxy, props, decorators, defaultDecorator);
          return proxy;
        }
      },
      ref: refDecorator$$1,
      shallow: shallowDecorator,
      deep: deepDecorator$$1,
      struct: refStructDecorator
    };
    var observable$$1 = createObservable; // weird trick to keep our typings nicely with our funcs, and still extend the observable function

    Object.keys(observableFactories).forEach(function (name) {
      return observable$$1[name] = observableFactories[name];
    });

    function incorrectlyUsedAsDecorator(methodName) {
      fail$$1( // process.env.NODE_ENV !== "production" &&
      "Expected one or two arguments to observable." + methodName + ". Did you accidentally try to use observable." + methodName + " as decorator?");
    }

    var computedDecorator$$1 = createPropDecorator$$1(false, function (instance, propertyName, descriptor, decoratorTarget, decoratorArgs) {
      var get$$1 = descriptor.get,
          set$$1 = descriptor.set; // initialValue is the descriptor for get / set props
      // Optimization: faster on decorator target or instance? Assuming target
      // Optimization: find out if declaring on instance isn't just faster. (also makes the property descriptor simpler). But, more memory usage..
      // Forcing instance now, fixes hot reloadig issues on React Native:

      var options = decoratorArgs[0] || {};
      asObservableObject$$1(instance).addComputedProp(instance, propertyName, __assign({
        get: get$$1,
        set: set$$1,
        context: instance
      }, options));
    });
    var computedStructDecorator = computedDecorator$$1({
      equals: comparer$$1.structural
    });
    /**
     * Decorator for class properties: @computed get value() { return expr; }.
     * For legacy purposes also invokable as ES5 observable created: `computed(() => expr)`;
     */

    var computed$$1 = function computed$$1(arg1, arg2, arg3) {
      if (typeof arg2 === "string") {
        // @computed
        return computedDecorator$$1.apply(null, arguments);
      }

      if (arg1 !== null && typeof arg1 === "object" && arguments.length === 1) {
        // @computed({ options })
        return computedDecorator$$1.apply(null, arguments);
      } // computed(expr, options?)


      if (process.env.NODE_ENV !== "production") {
        invariant$$1(typeof arg1 === "function", "First argument to `computed` should be an expression.");
        invariant$$1(arguments.length < 3, "Computed takes one or two arguments if used as function");
      }

      var opts = typeof arg2 === "object" ? arg2 : {};
      opts.get = arg1;
      opts.set = typeof arg2 === "function" ? arg2 : opts.set;
      opts.name = opts.name || arg1.name || "";
      /* for generated name */

      return new ComputedValue$$1(opts);
    };

    computed$$1.struct = computedStructDecorator;

    function createAction$$1(actionName, fn, ref) {
      if (process.env.NODE_ENV !== "production") {
        invariant$$1(typeof fn === "function", "`action` can only be invoked on functions");
        if (typeof actionName !== "string" || !actionName) fail$$1("actions should have valid names, got: '" + actionName + "'");
      }

      var res = function () {
        return executeAction$$1(actionName, fn, ref || this, arguments);
      };

      res.isMobxAction = true;
      return res;
    }

    function executeAction$$1(actionName, fn, scope, args) {
      var runInfo = startAction(actionName, fn, scope, args);
      var shouldSupressReactionError = true;

      try {
        var res = fn.apply(scope, args);
        shouldSupressReactionError = false;
        return res;
      } finally {
        if (shouldSupressReactionError) {
          globalState$$1.suppressReactionErrors = shouldSupressReactionError;
          endAction(runInfo);
          globalState$$1.suppressReactionErrors = false;
        } else {
          endAction(runInfo);
        }
      }
    }

    function startAction(actionName, fn, scope, args) {
      var notifySpy = isSpyEnabled$$1() && !!actionName;
      var startTime = 0;

      if (notifySpy && process.env.NODE_ENV !== "production") {
        startTime = Date.now();
        var l = args && args.length || 0;
        var flattendArgs = new Array(l);
        if (l > 0) for (var i = 0; i < l; i++) flattendArgs[i] = args[i];
        spyReportStart$$1({
          type: "action",
          name: actionName,
          object: scope,
          arguments: flattendArgs
        });
      }

      var prevDerivation = untrackedStart$$1();
      startBatch$$1();
      var prevAllowStateChanges = allowStateChangesStart$$1(true);
      return {
        prevDerivation: prevDerivation,
        prevAllowStateChanges: prevAllowStateChanges,
        notifySpy: notifySpy,
        startTime: startTime
      };
    }

    function endAction(runInfo) {
      allowStateChangesEnd$$1(runInfo.prevAllowStateChanges);
      endBatch$$1();
      untrackedEnd$$1(runInfo.prevDerivation);
      if (runInfo.notifySpy && process.env.NODE_ENV !== "production") spyReportEnd$$1({
        time: Date.now() - runInfo.startTime
      });
    }

    function allowStateChangesStart$$1(allowStateChanges$$1) {
      var prev = globalState$$1.allowStateChanges;
      globalState$$1.allowStateChanges = allowStateChanges$$1;
      return prev;
    }

    function allowStateChangesEnd$$1(prev) {
      globalState$$1.allowStateChanges = prev;
    }

    var ObservableValue$$1 =
    /** @class */
    function (_super) {
      __extends(ObservableValue$$1, _super);

      function ObservableValue$$1(value, enhancer, name, notifySpy, equals) {
        if (name === void 0) {
          name = "ObservableValue@" + getNextId$$1();
        }

        if (notifySpy === void 0) {
          notifySpy = true;
        }

        if (equals === void 0) {
          equals = comparer$$1.default;
        }

        var _this = _super.call(this, name) || this;

        _this.enhancer = enhancer;
        _this.name = name;
        _this.equals = equals;
        _this.hasUnreportedChange = false;
        _this.value = enhancer(value, undefined, name);

        if (notifySpy && isSpyEnabled$$1() && process.env.NODE_ENV !== "production") {
          // only notify spy if this is a stand-alone observable
          spyReport$$1({
            type: "create",
            name: _this.name,
            newValue: "" + _this.value
          });
        }

        return _this;
      }

      ObservableValue$$1.prototype.dehanceValue = function (value) {
        if (this.dehancer !== undefined) return this.dehancer(value);
        return value;
      };

      ObservableValue$$1.prototype.set = function (newValue) {
        var oldValue = this.value;
        newValue = this.prepareNewValue(newValue);

        if (newValue !== globalState$$1.UNCHANGED) {
          var notifySpy = isSpyEnabled$$1();

          if (notifySpy && process.env.NODE_ENV !== "production") {
            spyReportStart$$1({
              type: "update",
              name: this.name,
              newValue: newValue,
              oldValue: oldValue
            });
          }

          this.setNewValue(newValue);
          if (notifySpy && process.env.NODE_ENV !== "production") spyReportEnd$$1();
        }
      };

      ObservableValue$$1.prototype.prepareNewValue = function (newValue) {
        checkIfStateModificationsAreAllowed$$1(this);

        if (hasInterceptors$$1(this)) {
          var change = interceptChange$$1(this, {
            object: this,
            type: "update",
            newValue: newValue
          });
          if (!change) return globalState$$1.UNCHANGED;
          newValue = change.newValue;
        } // apply modifier


        newValue = this.enhancer(newValue, this.value, this.name);
        return this.equals(this.value, newValue) ? globalState$$1.UNCHANGED : newValue;
      };

      ObservableValue$$1.prototype.setNewValue = function (newValue) {
        var oldValue = this.value;
        this.value = newValue;
        this.reportChanged();

        if (hasListeners$$1(this)) {
          notifyListeners$$1(this, {
            type: "update",
            object: this,
            newValue: newValue,
            oldValue: oldValue
          });
        }
      };

      ObservableValue$$1.prototype.get = function () {
        this.reportObserved();
        return this.dehanceValue(this.value);
      };

      ObservableValue$$1.prototype.intercept = function (handler) {
        return registerInterceptor$$1(this, handler);
      };

      ObservableValue$$1.prototype.observe = function (listener, fireImmediately) {
        if (fireImmediately) listener({
          object: this,
          type: "update",
          newValue: this.value,
          oldValue: undefined
        });
        return registerListener$$1(this, listener);
      };

      ObservableValue$$1.prototype.toJSON = function () {
        return this.get();
      };

      ObservableValue$$1.prototype.toString = function () {
        return this.name + "[" + this.value + "]";
      };

      ObservableValue$$1.prototype.valueOf = function () {
        return toPrimitive$$1(this.get());
      };

      ObservableValue$$1.prototype[Symbol.toPrimitive] = function () {
        return this.valueOf();
      };

      return ObservableValue$$1;
    }(Atom$$1);

    var isObservableValue$$1 = createInstanceofPredicate$$1("ObservableValue", ObservableValue$$1);
    /**
     * A node in the state dependency root that observes other nodes, and can be observed itself.
     *
     * ComputedValue will remember the result of the computation for the duration of the batch, or
     * while being observed.
     *
     * During this time it will recompute only when one of its direct dependencies changed,
     * but only when it is being accessed with `ComputedValue.get()`.
     *
     * Implementation description:
     * 1. First time it's being accessed it will compute and remember result
     *    give back remembered result until 2. happens
     * 2. First time any deep dependency change, propagate POSSIBLY_STALE to all observers, wait for 3.
     * 3. When it's being accessed, recompute if any shallow dependency changed.
     *    if result changed: propagate STALE to all observers, that were POSSIBLY_STALE from the last step.
     *    go to step 2. either way
     *
     * If at any point it's outside batch and it isn't observed: reset everything and go to 1.
     */

    var ComputedValue$$1 =
    /** @class */
    function () {
      /**
       * Create a new computed value based on a function expression.
       *
       * The `name` property is for debug purposes only.
       *
       * The `equals` property specifies the comparer function to use to determine if a newly produced
       * value differs from the previous value. Two comparers are provided in the library; `defaultComparer`
       * compares based on identity comparison (===), and `structualComparer` deeply compares the structure.
       * Structural comparison can be convenient if you always produce a new aggregated object and
       * don't want to notify observers if it is structurally the same.
       * This is useful for working with vectors, mouse coordinates etc.
       */
      function ComputedValue$$1(options) {
        this.dependenciesState = IDerivationState.NOT_TRACKING;
        this.observing = []; // nodes we are looking at. Our value depends on these nodes

        this.newObserving = null; // during tracking it's an array with new observed observers

        this.isBeingObserved = false;
        this.isPendingUnobservation = false;
        this.observers = new Set();
        this.diffValue = 0;
        this.runId = 0;
        this.lastAccessedBy = 0;
        this.lowestObserverState = IDerivationState.UP_TO_DATE;
        this.unboundDepsCount = 0;
        this.__mapid = "#" + getNextId$$1();
        this.value = new CaughtException$$1(null);
        this.isComputing = false; // to check for cycles

        this.isRunningSetter = false;
        this.isTracing = TraceMode$$1.NONE;
        if (process.env.NODE_ENV !== "production" && !options.get) throw "[mobx] missing option for computed: get";
        this.derivation = options.get;
        this.name = options.name || "ComputedValue@" + getNextId$$1();
        if (options.set) this.setter = createAction$$1(this.name + "-setter", options.set);
        this.equals = options.equals || (options.compareStructural || options.struct ? comparer$$1.structural : comparer$$1.default);
        this.scope = options.context;
        this.requiresReaction = !!options.requiresReaction;
        this.keepAlive = !!options.keepAlive;
      }

      ComputedValue$$1.prototype.onBecomeStale = function () {
        propagateMaybeChanged$$1(this);
      };

      ComputedValue$$1.prototype.onBecomeObserved = function () {
        if (this.onBecomeObservedListeners) {
          this.onBecomeObservedListeners.forEach(function (listener) {
            return listener();
          });
        }
      };

      ComputedValue$$1.prototype.onBecomeUnobserved = function () {
        if (this.onBecomeUnobservedListeners) {
          this.onBecomeUnobservedListeners.forEach(function (listener) {
            return listener();
          });
        }
      };
      /**
       * Returns the current value of this computed value.
       * Will evaluate its computation first if needed.
       */


      ComputedValue$$1.prototype.get = function () {
        if (this.isComputing) fail$$1("Cycle detected in computation " + this.name + ": " + this.derivation);

        if (globalState$$1.inBatch === 0 && this.observers.size === 0 && !this.keepAlive) {
          if (shouldCompute$$1(this)) {
            this.warnAboutUntrackedRead();
            startBatch$$1(); // See perf test 'computed memoization'

            this.value = this.computeValue(false);
            endBatch$$1();
          }
        } else {
          reportObserved$$1(this);
          if (shouldCompute$$1(this)) if (this.trackAndCompute()) propagateChangeConfirmed$$1(this);
        }

        var result = this.value;
        if (isCaughtException$$1(result)) throw result.cause;
        return result;
      };

      ComputedValue$$1.prototype.peek = function () {
        var res = this.computeValue(false);
        if (isCaughtException$$1(res)) throw res.cause;
        return res;
      };

      ComputedValue$$1.prototype.set = function (value) {
        if (this.setter) {
          invariant$$1(!this.isRunningSetter, "The setter of computed value '" + this.name + "' is trying to update itself. Did you intend to update an _observable_ value, instead of the computed property?");
          this.isRunningSetter = true;

          try {
            this.setter.call(this.scope, value);
          } finally {
            this.isRunningSetter = false;
          }
        } else invariant$$1(false, process.env.NODE_ENV !== "production" && "[ComputedValue '" + this.name + "'] It is not possible to assign a new value to a computed value.");
      };

      ComputedValue$$1.prototype.trackAndCompute = function () {
        if (isSpyEnabled$$1() && process.env.NODE_ENV !== "production") {
          spyReport$$1({
            object: this.scope,
            type: "compute",
            name: this.name
          });
        }

        var oldValue = this.value;
        var wasSuspended =
        /* see #1208 */
        this.dependenciesState === IDerivationState.NOT_TRACKING;
        var newValue = this.computeValue(true);
        var changed = wasSuspended || isCaughtException$$1(oldValue) || isCaughtException$$1(newValue) || !this.equals(oldValue, newValue);

        if (changed) {
          this.value = newValue;
        }

        return changed;
      };

      ComputedValue$$1.prototype.computeValue = function (track) {
        this.isComputing = true;
        globalState$$1.computationDepth++;
        var res;

        if (track) {
          res = trackDerivedFunction$$1(this, this.derivation, this.scope);
        } else {
          if (globalState$$1.disableErrorBoundaries === true) {
            res = this.derivation.call(this.scope);
          } else {
            try {
              res = this.derivation.call(this.scope);
            } catch (e) {
              res = new CaughtException$$1(e);
            }
          }
        }

        globalState$$1.computationDepth--;
        this.isComputing = false;
        return res;
      };

      ComputedValue$$1.prototype.suspend = function () {
        if (!this.keepAlive) {
          clearObserving$$1(this);
          this.value = undefined; // don't hold on to computed value!
        }
      };

      ComputedValue$$1.prototype.observe = function (listener, fireImmediately) {
        var _this = this;

        var firstTime = true;
        var prevValue = undefined;
        return autorun$$1(function () {
          var newValue = _this.get();

          if (!firstTime || fireImmediately) {
            var prevU = untrackedStart$$1();
            listener({
              type: "update",
              object: _this,
              newValue: newValue,
              oldValue: prevValue
            });
            untrackedEnd$$1(prevU);
          }

          firstTime = false;
          prevValue = newValue;
        });
      };

      ComputedValue$$1.prototype.warnAboutUntrackedRead = function () {
        if (process.env.NODE_ENV === "production") return;

        if (this.requiresReaction === true) {
          fail$$1("[mobx] Computed value " + this.name + " is read outside a reactive context");
        }

        if (this.isTracing !== TraceMode$$1.NONE) {
          console.log("[mobx.trace] '" + this.name + "' is being read outside a reactive context. Doing a full recompute");
        }

        if (globalState$$1.computedRequiresReaction) {
          console.warn("[mobx] Computed value " + this.name + " is being read outside a reactive context. Doing a full recompute");
        }
      };

      ComputedValue$$1.prototype.toJSON = function () {
        return this.get();
      };

      ComputedValue$$1.prototype.toString = function () {
        return this.name + "[" + this.derivation.toString() + "]";
      };

      ComputedValue$$1.prototype.valueOf = function () {
        return toPrimitive$$1(this.get());
      };

      ComputedValue$$1.prototype[Symbol.toPrimitive] = function () {
        return this.valueOf();
      };

      return ComputedValue$$1;
    }();

    var isComputedValue$$1 = createInstanceofPredicate$$1("ComputedValue", ComputedValue$$1);
    var IDerivationState;

    (function (IDerivationState$$1) {
      // before being run or (outside batch and not being observed)
      // at this point derivation is not holding any data about dependency tree
      IDerivationState$$1[IDerivationState$$1["NOT_TRACKING"] = -1] = "NOT_TRACKING"; // no shallow dependency changed since last computation
      // won't recalculate derivation
      // this is what makes mobx fast

      IDerivationState$$1[IDerivationState$$1["UP_TO_DATE"] = 0] = "UP_TO_DATE"; // some deep dependency changed, but don't know if shallow dependency changed
      // will require to check first if UP_TO_DATE or POSSIBLY_STALE
      // currently only ComputedValue will propagate POSSIBLY_STALE
      //
      // having this state is second big optimization:
      // don't have to recompute on every dependency change, but only when it's needed

      IDerivationState$$1[IDerivationState$$1["POSSIBLY_STALE"] = 1] = "POSSIBLY_STALE"; // A shallow dependency has changed since last computation and the derivation
      // will need to recompute when it's needed next.

      IDerivationState$$1[IDerivationState$$1["STALE"] = 2] = "STALE";
    })(IDerivationState || (IDerivationState = {}));

    var TraceMode$$1;

    (function (TraceMode$$1) {
      TraceMode$$1[TraceMode$$1["NONE"] = 0] = "NONE";
      TraceMode$$1[TraceMode$$1["LOG"] = 1] = "LOG";
      TraceMode$$1[TraceMode$$1["BREAK"] = 2] = "BREAK";
    })(TraceMode$$1 || (TraceMode$$1 = {}));

    var CaughtException$$1 =
    /** @class */
    function () {
      function CaughtException$$1(cause) {
        this.cause = cause; // Empty
      }

      return CaughtException$$1;
    }();

    function isCaughtException$$1(e) {
      return e instanceof CaughtException$$1;
    }
    /**
     * Finds out whether any dependency of the derivation has actually changed.
     * If dependenciesState is 1 then it will recalculate dependencies,
     * if any dependency changed it will propagate it by changing dependenciesState to 2.
     *
     * By iterating over the dependencies in the same order that they were reported and
     * stopping on the first change, all the recalculations are only called for ComputedValues
     * that will be tracked by derivation. That is because we assume that if the first x
     * dependencies of the derivation doesn't change then the derivation should run the same way
     * up until accessing x-th dependency.
     */


    function shouldCompute$$1(derivation) {
      switch (derivation.dependenciesState) {
        case IDerivationState.UP_TO_DATE:
          return false;

        case IDerivationState.NOT_TRACKING:
        case IDerivationState.STALE:
          return true;

        case IDerivationState.POSSIBLY_STALE:
          {
            var prevUntracked = untrackedStart$$1(); // no need for those computeds to be reported, they will be picked up in trackDerivedFunction.

            var obs = derivation.observing,
                l = obs.length;

            for (var i = 0; i < l; i++) {
              var obj = obs[i];

              if (isComputedValue$$1(obj)) {
                if (globalState$$1.disableErrorBoundaries) {
                  obj.get();
                } else {
                  try {
                    obj.get();
                  } catch (e) {
                    // we are not interested in the value *or* exception at this moment, but if there is one, notify all
                    untrackedEnd$$1(prevUntracked);
                    return true;
                  }
                } // if ComputedValue `obj` actually changed it will be computed and propagated to its observers.
                // and `derivation` is an observer of `obj`
                // invariantShouldCompute(derivation)


                if (derivation.dependenciesState === IDerivationState.STALE) {
                  untrackedEnd$$1(prevUntracked);
                  return true;
                }
              }
            }

            changeDependenciesStateTo0$$1(derivation);
            untrackedEnd$$1(prevUntracked);
            return false;
          }
      }
    } // function invariantShouldCompute(derivation: IDerivation) {

    function checkIfStateModificationsAreAllowed$$1(atom) {
      var hasObservers$$1 = atom.observers.size > 0; // Should never be possible to change an observed observable from inside computed, see #798

      if (globalState$$1.computationDepth > 0 && hasObservers$$1) fail$$1(process.env.NODE_ENV !== "production" && "Computed values are not allowed to cause side effects by changing observables that are already being observed. Tried to modify: " + atom.name); // Should not be possible to change observed state outside strict mode, except during initialization, see #563

      if (!globalState$$1.allowStateChanges && (hasObservers$$1 || globalState$$1.enforceActions === "strict")) fail$$1(process.env.NODE_ENV !== "production" && (globalState$$1.enforceActions ? "Since strict-mode is enabled, changing observed observable values outside actions is not allowed. Please wrap the code in an `action` if this change is intended. Tried to modify: " : "Side effects like changing state are not allowed at this point. Are you trying to modify state from, for example, the render function of a React component? Tried to modify: ") + atom.name);
    }
    /**
     * Executes the provided function `f` and tracks which observables are being accessed.
     * The tracking information is stored on the `derivation` object and the derivation is registered
     * as observer of any of the accessed observables.
     */


    function trackDerivedFunction$$1(derivation, f, context) {
      // pre allocate array allocation + room for variation in deps
      // array will be trimmed by bindDependencies
      changeDependenciesStateTo0$$1(derivation);
      derivation.newObserving = new Array(derivation.observing.length + 100);
      derivation.unboundDepsCount = 0;
      derivation.runId = ++globalState$$1.runId;
      var prevTracking = globalState$$1.trackingDerivation;
      globalState$$1.trackingDerivation = derivation;
      var result;

      if (globalState$$1.disableErrorBoundaries === true) {
        result = f.call(context);
      } else {
        try {
          result = f.call(context);
        } catch (e) {
          result = new CaughtException$$1(e);
        }
      }

      globalState$$1.trackingDerivation = prevTracking;
      bindDependencies(derivation);
      return result;
    }
    /**
     * diffs newObserving with observing.
     * update observing to be newObserving with unique observables
     * notify observers that become observed/unobserved
     */


    function bindDependencies(derivation) {
      // invariant(derivation.dependenciesState !== IDerivationState.NOT_TRACKING, "INTERNAL ERROR bindDependencies expects derivation.dependenciesState !== -1");
      var prevObserving = derivation.observing;
      var observing = derivation.observing = derivation.newObserving;
      var lowestNewObservingDerivationState = IDerivationState.UP_TO_DATE; // Go through all new observables and check diffValue: (this list can contain duplicates):
      //   0: first occurrence, change to 1 and keep it
      //   1: extra occurrence, drop it

      var i0 = 0,
          l = derivation.unboundDepsCount;

      for (var i = 0; i < l; i++) {
        var dep = observing[i];

        if (dep.diffValue === 0) {
          dep.diffValue = 1;
          if (i0 !== i) observing[i0] = dep;
          i0++;
        } // Upcast is 'safe' here, because if dep is IObservable, `dependenciesState` will be undefined,
        // not hitting the condition


        if (dep.dependenciesState > lowestNewObservingDerivationState) {
          lowestNewObservingDerivationState = dep.dependenciesState;
        }
      }

      observing.length = i0;
      derivation.newObserving = null; // newObserving shouldn't be needed outside tracking (statement moved down to work around FF bug, see #614)
      // Go through all old observables and check diffValue: (it is unique after last bindDependencies)
      //   0: it's not in new observables, unobserve it
      //   1: it keeps being observed, don't want to notify it. change to 0

      l = prevObserving.length;

      while (l--) {
        var dep = prevObserving[l];

        if (dep.diffValue === 0) {
          removeObserver$$1(dep, derivation);
        }

        dep.diffValue = 0;
      } // Go through all new observables and check diffValue: (now it should be unique)
      //   0: it was set to 0 in last loop. don't need to do anything.
      //   1: it wasn't observed, let's observe it. set back to 0


      while (i0--) {
        var dep = observing[i0];

        if (dep.diffValue === 1) {
          dep.diffValue = 0;
          addObserver$$1(dep, derivation);
        }
      } // Some new observed derivations may become stale during this derivation computation
      // so they have had no chance to propagate staleness (#916)


      if (lowestNewObservingDerivationState !== IDerivationState.UP_TO_DATE) {
        derivation.dependenciesState = lowestNewObservingDerivationState;
        derivation.onBecomeStale();
      }
    }

    function clearObserving$$1(derivation) {
      // invariant(globalState.inBatch > 0, "INTERNAL ERROR clearObserving should be called only inside batch");
      var obs = derivation.observing;
      derivation.observing = [];
      var i = obs.length;

      while (i--) removeObserver$$1(obs[i], derivation);

      derivation.dependenciesState = IDerivationState.NOT_TRACKING;
    }

    function untracked$$1(action$$1) {
      var prev = untrackedStart$$1();

      try {
        return action$$1();
      } finally {
        untrackedEnd$$1(prev);
      }
    }

    function untrackedStart$$1() {
      var prev = globalState$$1.trackingDerivation;
      globalState$$1.trackingDerivation = null;
      return prev;
    }

    function untrackedEnd$$1(prev) {
      globalState$$1.trackingDerivation = prev;
    }
    /**
     * needed to keep `lowestObserverState` correct. when changing from (2 or 1) to 0
     *
     */


    function changeDependenciesStateTo0$$1(derivation) {
      if (derivation.dependenciesState === IDerivationState.UP_TO_DATE) return;
      derivation.dependenciesState = IDerivationState.UP_TO_DATE;
      var obs = derivation.observing;
      var i = obs.length;

      while (i--) obs[i].lowestObserverState = IDerivationState.UP_TO_DATE;
    }

    var MobXGlobals$$1 =
    /** @class */
    function () {
      function MobXGlobals$$1() {
        /**
         * MobXGlobals version.
         * MobX compatiblity with other versions loaded in memory as long as this version matches.
         * It indicates that the global state still stores similar information
         *
         * N.B: this version is unrelated to the package version of MobX, and is only the version of the
         * internal state storage of MobX, and can be the same across many different package versions
         */
        this.version = 5;
        /**
         * globally unique token to signal unchanged
         */

        this.UNCHANGED = {};
        /**
         * Currently running derivation
         */

        this.trackingDerivation = null;
        /**
         * Are we running a computation currently? (not a reaction)
         */

        this.computationDepth = 0;
        /**
         * Each time a derivation is tracked, it is assigned a unique run-id
         */

        this.runId = 0;
        /**
         * 'guid' for general purpose. Will be persisted amongst resets.
         */

        this.mobxGuid = 0;
        /**
         * Are we in a batch block? (and how many of them)
         */

        this.inBatch = 0;
        /**
         * Observables that don't have observers anymore, and are about to be
         * suspended, unless somebody else accesses it in the same batch
         *
         * @type {IObservable[]}
         */

        this.pendingUnobservations = [];
        /**
         * List of scheduled, not yet executed, reactions.
         */

        this.pendingReactions = [];
        /**
         * Are we currently processing reactions?
         */

        this.isRunningReactions = false;
        /**
         * Is it allowed to change observables at this point?
         * In general, MobX doesn't allow that when running computations and React.render.
         * To ensure that those functions stay pure.
         */

        this.allowStateChanges = true;
        /**
         * If strict mode is enabled, state changes are by default not allowed
         */

        this.enforceActions = false;
        /**
         * Spy callbacks
         */

        this.spyListeners = [];
        /**
         * Globally attached error handlers that react specifically to errors in reactions
         */

        this.globalReactionErrorHandlers = [];
        /**
         * Warn if computed values are accessed outside a reactive context
         */

        this.computedRequiresReaction = false;
        /*
         * Don't catch and rethrow exceptions. This is useful for inspecting the state of
         * the stack when an exception occurs while debugging.
         */

        this.disableErrorBoundaries = false;
        /*
         * If true, we are already handling an exception in an action. Any errors in reactions should be supressed, as
         * they are not the cause, see: https://github.com/mobxjs/mobx/issues/1836
         */

        this.suppressReactionErrors = false;
      }

      return MobXGlobals$$1;
    }();

    var canMergeGlobalState = true;
    var isolateCalled = false;

    var globalState$$1 = function () {
      var global = getGlobal$$1();
      if (global.__mobxInstanceCount > 0 && !global.__mobxGlobals) canMergeGlobalState = false;
      if (global.__mobxGlobals && global.__mobxGlobals.version !== new MobXGlobals$$1().version) canMergeGlobalState = false;

      if (!canMergeGlobalState) {
        setTimeout(function () {
          if (!isolateCalled) {
            fail$$1("There are multiple, different versions of MobX active. Make sure MobX is loaded only once or use `configure({ isolateGlobalState: true })`");
          }
        }, 1);
        return new MobXGlobals$$1();
      } else if (global.__mobxGlobals) {
        global.__mobxInstanceCount += 1;
        if (!global.__mobxGlobals.UNCHANGED) global.__mobxGlobals.UNCHANGED = {}; // make merge backward compatible

        return global.__mobxGlobals;
      } else {
        global.__mobxInstanceCount = 1;
        return global.__mobxGlobals = new MobXGlobals$$1();
      }
    }();

    function getGlobal$$1() {
      return typeof window !== "undefined" ? window : global;
    }
    //     const list = observable.observers
    //     const map = observable.observersIndexes
    //     const l = list.length
    //     for (let i = 0; i < l; i++) {
    //         const id = list[i].__mapid
    //         if (i) {
    //             invariant(map[id] === i, "INTERNAL ERROR maps derivation.__mapid to index in list") // for performance
    //         } else {
    //             invariant(!(id in map), "INTERNAL ERROR observer on index 0 shouldn't be held in map.") // for performance
    //         }
    //     }
    //     invariant(
    //         list.length === 0 || Object.keys(map).length === list.length - 1,
    //         "INTERNAL ERROR there is no junk in map"
    //     )
    // }


    function addObserver$$1(observable$$1, node) {
      // invariant(node.dependenciesState !== -1, "INTERNAL ERROR, can add only dependenciesState !== -1");
      // invariant(observable._observers.indexOf(node) === -1, "INTERNAL ERROR add already added node");
      // invariantObservers(observable);
      observable$$1.observers.add(node);
      if (observable$$1.lowestObserverState > node.dependenciesState) observable$$1.lowestObserverState = node.dependenciesState; // invariantObservers(observable);
      // invariant(observable._observers.indexOf(node) !== -1, "INTERNAL ERROR didn't add node");
    }

    function removeObserver$$1(observable$$1, node) {
      // invariant(globalState.inBatch > 0, "INTERNAL ERROR, remove should be called only inside batch");
      // invariant(observable._observers.indexOf(node) !== -1, "INTERNAL ERROR remove already removed node");
      // invariantObservers(observable);
      observable$$1.observers.delete(node);

      if (observable$$1.observers.size === 0) {
        // deleting last observer
        queueForUnobservation$$1(observable$$1);
      } // invariantObservers(observable);
      // invariant(observable._observers.indexOf(node) === -1, "INTERNAL ERROR remove already removed node2");

    }

    function queueForUnobservation$$1(observable$$1) {
      if (observable$$1.isPendingUnobservation === false) {
        // invariant(observable._observers.length === 0, "INTERNAL ERROR, should only queue for unobservation unobserved observables");
        observable$$1.isPendingUnobservation = true;
        globalState$$1.pendingUnobservations.push(observable$$1);
      }
    }
    /**
     * Batch starts a transaction, at least for purposes of memoizing ComputedValues when nothing else does.
     * During a batch `onBecomeUnobserved` will be called at most once per observable.
     * Avoids unnecessary recalculations.
     */


    function startBatch$$1() {
      globalState$$1.inBatch++;
    }

    function endBatch$$1() {
      if (--globalState$$1.inBatch === 0) {
        runReactions$$1(); // the batch is actually about to finish, all unobserving should happen here.

        var list = globalState$$1.pendingUnobservations;

        for (var i = 0; i < list.length; i++) {
          var observable$$1 = list[i];
          observable$$1.isPendingUnobservation = false;

          if (observable$$1.observers.size === 0) {
            if (observable$$1.isBeingObserved) {
              // if this observable had reactive observers, trigger the hooks
              observable$$1.isBeingObserved = false;
              observable$$1.onBecomeUnobserved();
            }

            if (observable$$1 instanceof ComputedValue$$1) {
              // computed values are automatically teared down when the last observer leaves
              // this process happens recursively, this computed might be the last observabe of another, etc..
              observable$$1.suspend();
            }
          }
        }

        globalState$$1.pendingUnobservations = [];
      }
    }

    function reportObserved$$1(observable$$1) {
      var derivation = globalState$$1.trackingDerivation;

      if (derivation !== null) {
        /**
         * Simple optimization, give each derivation run an unique id (runId)
         * Check if last time this observable was accessed the same runId is used
         * if this is the case, the relation is already known
         */
        if (derivation.runId !== observable$$1.lastAccessedBy) {
          observable$$1.lastAccessedBy = derivation.runId; // Tried storing newObserving, or observing, or both as Set, but performance didn't come close...

          derivation.newObserving[derivation.unboundDepsCount++] = observable$$1;

          if (!observable$$1.isBeingObserved) {
            observable$$1.isBeingObserved = true;
            observable$$1.onBecomeObserved();
          }
        }

        return true;
      } else if (observable$$1.observers.size === 0 && globalState$$1.inBatch > 0) {
        queueForUnobservation$$1(observable$$1);
      }

      return false;
    } // function invariantLOS(observable: IObservable, msg: string) {
    //     // it's expensive so better not run it in produciton. but temporarily helpful for testing
    //     const min = getObservers(observable).reduce((a, b) => Math.min(a, b.dependenciesState), 2)
    //     if (min >= observable.lowestObserverState) return // <- the only assumption about `lowestObserverState`
    //     throw new Error(
    //         "lowestObserverState is wrong for " +
    //             msg +
    //             " because " +
    //             min +
    //             " < " +
    //             observable.lowestObserverState
    //     )
    // }

    /**
     * NOTE: current propagation mechanism will in case of self reruning autoruns behave unexpectedly
     * It will propagate changes to observers from previous run
     * It's hard or maybe impossible (with reasonable perf) to get it right with current approach
     * Hopefully self reruning autoruns aren't a feature people should depend on
     * Also most basic use cases should be ok
     */
    // Called by Atom when its value changes


    function propagateChanged$$1(observable$$1) {
      // invariantLOS(observable, "changed start");
      if (observable$$1.lowestObserverState === IDerivationState.STALE) return;
      observable$$1.lowestObserverState = IDerivationState.STALE; // Ideally we use for..of here, but the downcompiled version is really slow...

      observable$$1.observers.forEach(function (d) {
        if (d.dependenciesState === IDerivationState.UP_TO_DATE) {
          if (d.isTracing !== TraceMode$$1.NONE) {
            logTraceInfo(d, observable$$1);
          }

          d.onBecomeStale();
        }

        d.dependenciesState = IDerivationState.STALE;
      }); // invariantLOS(observable, "changed end");
    } // Called by ComputedValue when it recalculate and its value changed


    function propagateChangeConfirmed$$1(observable$$1) {
      // invariantLOS(observable, "confirmed start");
      if (observable$$1.lowestObserverState === IDerivationState.STALE) return;
      observable$$1.lowestObserverState = IDerivationState.STALE;
      observable$$1.observers.forEach(function (d) {
        if (d.dependenciesState === IDerivationState.POSSIBLY_STALE) d.dependenciesState = IDerivationState.STALE;else if (d.dependenciesState === IDerivationState.UP_TO_DATE // this happens during computing of `d`, just keep lowestObserverState up to date.
        ) observable$$1.lowestObserverState = IDerivationState.UP_TO_DATE;
      }); // invariantLOS(observable, "confirmed end");
    } // Used by computed when its dependency changed, but we don't wan't to immediately recompute.


    function propagateMaybeChanged$$1(observable$$1) {
      // invariantLOS(observable, "maybe start");
      if (observable$$1.lowestObserverState !== IDerivationState.UP_TO_DATE) return;
      observable$$1.lowestObserverState = IDerivationState.POSSIBLY_STALE;
      observable$$1.observers.forEach(function (d) {
        if (d.dependenciesState === IDerivationState.UP_TO_DATE) {
          d.dependenciesState = IDerivationState.POSSIBLY_STALE;

          if (d.isTracing !== TraceMode$$1.NONE) {
            logTraceInfo(d, observable$$1);
          }

          d.onBecomeStale();
        }
      }); // invariantLOS(observable, "maybe end");
    }

    function logTraceInfo(derivation, observable$$1) {
      console.log("[mobx.trace] '" + derivation.name + "' is invalidated due to a change in: '" + observable$$1.name + "'");

      if (derivation.isTracing === TraceMode$$1.BREAK) {
        var lines = [];
        printDepTree(getDependencyTree$$1(derivation), lines, 1); // prettier-ignore

        new Function("debugger;\n/*\nTracing '" + derivation.name + "'\n\nYou are entering this break point because derivation '" + derivation.name + "' is being traced and '" + observable$$1.name + "' is now forcing it to update.\nJust follow the stacktrace you should now see in the devtools to see precisely what piece of your code is causing this update\nThe stackframe you are looking for is at least ~6-8 stack-frames up.\n\n" + (derivation instanceof ComputedValue$$1 ? derivation.derivation.toString().replace(/[*]\//g, "/") : "") + "\n\nThe dependencies for this derivation are:\n\n" + lines.join("\n") + "\n*/\n    ")();
      }
    }

    function printDepTree(tree, lines, depth) {
      if (lines.length >= 1000) {
        lines.push("(and many more)");
        return;
      }

      lines.push("" + new Array(depth).join("\t") + tree.name); // MWE: not the fastest, but the easiest way :)

      if (tree.dependencies) tree.dependencies.forEach(function (child) {
        return printDepTree(child, lines, depth + 1);
      });
    }

    var Reaction$$1 =
    /** @class */
    function () {
      function Reaction$$1(name, onInvalidate, errorHandler) {
        if (name === void 0) {
          name = "Reaction@" + getNextId$$1();
        }

        this.name = name;
        this.onInvalidate = onInvalidate;
        this.errorHandler = errorHandler;
        this.observing = []; // nodes we are looking at. Our value depends on these nodes

        this.newObserving = [];
        this.dependenciesState = IDerivationState.NOT_TRACKING;
        this.diffValue = 0;
        this.runId = 0;
        this.unboundDepsCount = 0;
        this.__mapid = "#" + getNextId$$1();
        this.isDisposed = false;
        this._isScheduled = false;
        this._isTrackPending = false;
        this._isRunning = false;
        this.isTracing = TraceMode$$1.NONE;
      }

      Reaction$$1.prototype.onBecomeStale = function () {
        this.schedule();
      };

      Reaction$$1.prototype.schedule = function () {
        if (!this._isScheduled) {
          this._isScheduled = true;
          globalState$$1.pendingReactions.push(this);
          runReactions$$1();
        }
      };

      Reaction$$1.prototype.isScheduled = function () {
        return this._isScheduled;
      };
      /**
       * internal, use schedule() if you intend to kick off a reaction
       */


      Reaction$$1.prototype.runReaction = function () {
        if (!this.isDisposed) {
          startBatch$$1();
          this._isScheduled = false;

          if (shouldCompute$$1(this)) {
            this._isTrackPending = true;

            try {
              this.onInvalidate();

              if (this._isTrackPending && isSpyEnabled$$1() && process.env.NODE_ENV !== "production") {
                // onInvalidate didn't trigger track right away..
                spyReport$$1({
                  name: this.name,
                  type: "scheduled-reaction"
                });
              }
            } catch (e) {
              this.reportExceptionInDerivation(e);
            }
          }

          endBatch$$1();
        }
      };

      Reaction$$1.prototype.track = function (fn) {
        if (this.isDisposed) {
          fail$$1("Reaction already disposed");
        }

        startBatch$$1();
        var notify = isSpyEnabled$$1();
        var startTime;

        if (notify && process.env.NODE_ENV !== "production") {
          startTime = Date.now();
          spyReportStart$$1({
            name: this.name,
            type: "reaction"
          });
        }

        this._isRunning = true;
        var result = trackDerivedFunction$$1(this, fn, undefined);
        this._isRunning = false;
        this._isTrackPending = false;

        if (this.isDisposed) {
          // disposed during last run. Clean up everything that was bound after the dispose call.
          clearObserving$$1(this);
        }

        if (isCaughtException$$1(result)) this.reportExceptionInDerivation(result.cause);

        if (notify && process.env.NODE_ENV !== "production") {
          spyReportEnd$$1({
            time: Date.now() - startTime
          });
        }

        endBatch$$1();
      };

      Reaction$$1.prototype.reportExceptionInDerivation = function (error) {
        var _this = this;

        if (this.errorHandler) {
          this.errorHandler(error, this);
          return;
        }

        if (globalState$$1.disableErrorBoundaries) throw error;
        var message = "[mobx] Encountered an uncaught exception that was thrown by a reaction or observer component, in: '" + this + "'";

        if (globalState$$1.suppressReactionErrors) {
          console.warn("[mobx] (error in reaction '" + this.name + "' suppressed, fix error of causing action below)"); // prettier-ignore
        } else {
          console.error(message, error);
          /** If debugging brought you here, please, read the above message :-). Tnx! */
        }

        if (isSpyEnabled$$1()) {
          spyReport$$1({
            type: "error",
            name: this.name,
            message: message,
            error: "" + error
          });
        }

        globalState$$1.globalReactionErrorHandlers.forEach(function (f) {
          return f(error, _this);
        });
      };

      Reaction$$1.prototype.dispose = function () {
        if (!this.isDisposed) {
          this.isDisposed = true;

          if (!this._isRunning) {
            // if disposed while running, clean up later. Maybe not optimal, but rare case
            startBatch$$1();
            clearObserving$$1(this);
            endBatch$$1();
          }
        }
      };

      Reaction$$1.prototype.getDisposer = function () {
        var r = this.dispose.bind(this);
        r[$mobx$$1] = this;
        return r;
      };

      Reaction$$1.prototype.toString = function () {
        return "Reaction[" + this.name + "]";
      };

      Reaction$$1.prototype.trace = function (enterBreakPoint) {
        if (enterBreakPoint === void 0) {
          enterBreakPoint = false;
        }

        trace$$1(this, enterBreakPoint);
      };

      return Reaction$$1;
    }();
    /**
     * Magic number alert!
     * Defines within how many times a reaction is allowed to re-trigger itself
     * until it is assumed that this is gonna be a never ending loop...
     */


    var MAX_REACTION_ITERATIONS = 100;

    var reactionScheduler = function (f) {
      return f();
    };

    function runReactions$$1() {
      // Trampolining, if runReactions are already running, new reactions will be picked up
      if (globalState$$1.inBatch > 0 || globalState$$1.isRunningReactions) return;
      reactionScheduler(runReactionsHelper);
    }

    function runReactionsHelper() {
      globalState$$1.isRunningReactions = true;
      var allReactions = globalState$$1.pendingReactions;
      var iterations = 0; // While running reactions, new reactions might be triggered.
      // Hence we work with two variables and check whether
      // we converge to no remaining reactions after a while.

      while (allReactions.length > 0) {
        if (++iterations === MAX_REACTION_ITERATIONS) {
          console.error("Reaction doesn't converge to a stable state after " + MAX_REACTION_ITERATIONS + " iterations." + (" Probably there is a cycle in the reactive function: " + allReactions[0]));
          allReactions.splice(0); // clear reactions
        }

        var remainingReactions = allReactions.splice(0);

        for (var i = 0, l = remainingReactions.length; i < l; i++) remainingReactions[i].runReaction();
      }

      globalState$$1.isRunningReactions = false;
    }

    var isReaction$$1 = createInstanceofPredicate$$1("Reaction", Reaction$$1);

    function isSpyEnabled$$1() {
      return process.env.NODE_ENV !== "production" && !!globalState$$1.spyListeners.length;
    }

    function spyReport$$1(event) {
      if (process.env.NODE_ENV === "production") return; // dead code elimination can do the rest

      if (!globalState$$1.spyListeners.length) return;
      var listeners = globalState$$1.spyListeners;

      for (var i = 0, l = listeners.length; i < l; i++) listeners[i](event);
    }

    function spyReportStart$$1(event) {
      if (process.env.NODE_ENV === "production") return;

      var change = __assign({}, event, {
        spyReportStart: true
      });

      spyReport$$1(change);
    }

    var END_EVENT = {
      spyReportEnd: true
    };

    function spyReportEnd$$1(change) {
      if (process.env.NODE_ENV === "production") return;
      if (change) spyReport$$1(__assign({}, change, {
        spyReportEnd: true
      }));else spyReport$$1(END_EVENT);
    }

    function spy$$1(listener) {
      if (process.env.NODE_ENV === "production") {
        console.warn("[mobx.spy] Is a no-op in production builds");
        return function () {};
      } else {
        globalState$$1.spyListeners.push(listener);
        return once$$1(function () {
          globalState$$1.spyListeners = globalState$$1.spyListeners.filter(function (l) {
            return l !== listener;
          });
        });
      }
    }

    function runInAction$$1(arg1, arg2) {
      var actionName = typeof arg1 === "string" ? arg1 : arg1.name || "<unnamed action>";
      var fn = typeof arg1 === "function" ? arg1 : arg2;

      if (process.env.NODE_ENV !== "production") {
        invariant$$1(typeof fn === "function" && fn.length === 0, "`runInAction` expects a function without arguments");
        if (typeof actionName !== "string" || !actionName) fail$$1("actions should have valid names, got: '" + actionName + "'");
      }

      return executeAction$$1(actionName, fn, this, undefined);
    }

    function isAction$$1(thing) {
      return typeof thing === "function" && thing.isMobxAction === true;
    }
    /**
     * Creates a named reactive view and keeps it alive, so that the view is always
     * updated if one of the dependencies changes, even when the view is not further used by something else.
     * @param view The reactive view
     * @returns disposer function, which can be used to stop the view from being updated in the future.
     */


    function autorun$$1(view, opts) {
      if (opts === void 0) {
        opts = EMPTY_OBJECT$$1;
      }

      if (process.env.NODE_ENV !== "production") {
        invariant$$1(typeof view === "function", "Autorun expects a function as first argument");
        invariant$$1(isAction$$1(view) === false, "Autorun does not accept actions since actions are untrackable");
      }

      var name = opts && opts.name || view.name || "Autorun@" + getNextId$$1();
      var runSync = !opts.scheduler && !opts.delay;
      var reaction$$1;

      if (runSync) {
        // normal autorun
        reaction$$1 = new Reaction$$1(name, function () {
          this.track(reactionRunner);
        }, opts.onError);
      } else {
        var scheduler_1 = createSchedulerFromOptions(opts); // debounced autorun

        var isScheduled_1 = false;
        reaction$$1 = new Reaction$$1(name, function () {
          if (!isScheduled_1) {
            isScheduled_1 = true;
            scheduler_1(function () {
              isScheduled_1 = false;
              if (!reaction$$1.isDisposed) reaction$$1.track(reactionRunner);
            });
          }
        }, opts.onError);
      }

      function reactionRunner() {
        view(reaction$$1);
      }

      reaction$$1.schedule();
      return reaction$$1.getDisposer();
    }

    var run = function (f) {
      return f();
    };

    function createSchedulerFromOptions(opts) {
      return opts.scheduler ? opts.scheduler : opts.delay ? function (f) {
        return setTimeout(f, opts.delay);
      } : run;
    }

    function onBecomeObserved$$1(thing, arg2, arg3) {
      return interceptHook("onBecomeObserved", thing, arg2, arg3);
    }

    function onBecomeUnobserved$$1(thing, arg2, arg3) {
      return interceptHook("onBecomeUnobserved", thing, arg2, arg3);
    }

    function interceptHook(hook, thing, arg2, arg3) {
      var atom = typeof arg2 === "string" ? getAtom$$1(thing, arg2) : getAtom$$1(thing);
      var cb = typeof arg2 === "string" ? arg3 : arg2;
      var listenersKey = hook + "Listeners";

      if (atom[listenersKey]) {
        atom[listenersKey].add(cb);
      } else {
        atom[listenersKey] = new Set([cb]);
      }

      var orig = atom[hook];
      if (typeof orig !== "function") return fail$$1(process.env.NODE_ENV !== "production" && "Not an atom that can be (un)observed");
      return function () {
        var hookListeners = atom[listenersKey];

        if (hookListeners) {
          hookListeners.delete(cb);

          if (hookListeners.size === 0) {
            delete atom[listenersKey];
          }
        }
      };
    }

    function decorate$$1(thing, decorators) {
      process.env.NODE_ENV !== "production" && invariant$$1(isPlainObject$$1(decorators), "Decorators should be a key value map");
      var target = typeof thing === "function" ? thing.prototype : thing;

      var _loop_1 = function (prop) {
        var propertyDecorators = decorators[prop];

        if (!Array.isArray(propertyDecorators)) {
          propertyDecorators = [propertyDecorators];
        }

        process.env.NODE_ENV !== "production" && invariant$$1(propertyDecorators.every(function (decorator) {
          return typeof decorator === "function";
        }), "Decorate: expected a decorator function or array of decorator functions for '" + prop + "'");
        var descriptor = Object.getOwnPropertyDescriptor(target, prop);
        var newDescriptor = propertyDecorators.reduce(function (accDescriptor, decorator) {
          return decorator(target, prop, accDescriptor);
        }, descriptor);
        if (newDescriptor) Object.defineProperty(target, prop, newDescriptor);
      };

      for (var prop in decorators) {
        _loop_1(prop);
      }

      return thing;
    }

    function extendObservable$$1(target, properties, decorators, options) {
      if (process.env.NODE_ENV !== "production") {
        invariant$$1(arguments.length >= 2 && arguments.length <= 4, "'extendObservable' expected 2-4 arguments");
        invariant$$1(typeof target === "object", "'extendObservable' expects an object as first argument");
        invariant$$1(!isObservableMap$$1(target), "'extendObservable' should not be used on maps, use map.merge instead");
      }

      options = asCreateObservableOptions$$1(options);
      var defaultDecorator = getDefaultDecoratorFromObjectOptions$$1(options);
      initializeInstance$$1(target); // Fixes #1740

      asObservableObject$$1(target, options.name, defaultDecorator.enhancer); // make sure object is observable, even without initial props

      if (properties) extendObservableObjectWithProperties$$1(target, properties, decorators, defaultDecorator);
      return target;
    }

    function getDefaultDecoratorFromObjectOptions$$1(options) {
      return options.defaultDecorator || (options.deep === false ? refDecorator$$1 : deepDecorator$$1);
    }

    function extendObservableObjectWithProperties$$1(target, properties, decorators, defaultDecorator) {
      if (process.env.NODE_ENV !== "production") {
        invariant$$1(!isObservable$$1(properties), "Extending an object with another observable (object) is not supported. Please construct an explicit propertymap, using `toJS` if need. See issue #540");
        if (decorators) for (var key in decorators) if (!(key in properties)) fail$$1("Trying to declare a decorator for unspecified property '" + key + "'");
      }

      startBatch$$1();

      try {
        for (var key in properties) {
          var descriptor = Object.getOwnPropertyDescriptor(properties, key);

          if (process.env.NODE_ENV !== "production") {
            if (Object.getOwnPropertyDescriptor(target, key)) fail$$1("'extendObservable' can only be used to introduce new properties. Use 'set' or 'decorate' instead. The property '" + key + "' already exists on '" + target + "'");
            if (isComputed$$1(descriptor.value)) fail$$1("Passing a 'computed' as initial property value is no longer supported by extendObservable. Use a getter or decorator instead");
          }

          var decorator = decorators && key in decorators ? decorators[key] : descriptor.get ? computedDecorator$$1 : defaultDecorator;
          if (process.env.NODE_ENV !== "production" && typeof decorator !== "function") fail$$1("Not a valid decorator for '" + key + "', got: " + decorator);
          var resultDescriptor = decorator(target, key, descriptor, true);
          if (resultDescriptor // otherwise, assume already applied, due to `applyToInstance`
          ) Object.defineProperty(target, key, resultDescriptor);
        }
      } finally {
        endBatch$$1();
      }
    }

    function getDependencyTree$$1(thing, property) {
      return nodeToDependencyTree(getAtom$$1(thing, property));
    }

    function nodeToDependencyTree(node) {
      var result = {
        name: node.name
      };
      if (node.observing && node.observing.length > 0) result.dependencies = unique$$1(node.observing).map(nodeToDependencyTree);
      return result;
    }

    function _isComputed$$1(value, property) {
      if (value === null || value === undefined) return false;

      if (property !== undefined) {
        if (isObservableObject$$1(value) === false) return false;
        if (!value[$mobx$$1].values.has(property)) return false;
        var atom = getAtom$$1(value, property);
        return isComputedValue$$1(atom);
      }

      return isComputedValue$$1(value);
    }

    function isComputed$$1(value) {
      if (arguments.length > 1) return fail$$1(process.env.NODE_ENV !== "production" && "isComputed expects only 1 argument. Use isObservableProp to inspect the observability of a property");
      return _isComputed$$1(value);
    }

    function _isObservable(value, property) {
      if (value === null || value === undefined) return false;

      if (property !== undefined) {
        if (process.env.NODE_ENV !== "production" && (isObservableMap$$1(value) || isObservableArray$$1(value))) return fail$$1("isObservable(object, propertyName) is not supported for arrays and maps. Use map.has or array.length instead.");

        if (isObservableObject$$1(value)) {
          return value[$mobx$$1].values.has(property);
        }

        return false;
      } // For first check, see #701


      return isObservableObject$$1(value) || !!value[$mobx$$1] || isAtom$$1(value) || isReaction$$1(value) || isComputedValue$$1(value);
    }

    function isObservable$$1(value) {
      if (arguments.length !== 1) fail$$1(process.env.NODE_ENV !== "production" && "isObservable expects only 1 argument. Use isObservableProp to inspect the observability of a property");
      return _isObservable(value);
    }

    function set$$1(obj, key, value) {
      if (arguments.length === 2) {
        startBatch$$1();
        var values_1 = key;

        try {
          for (var key_1 in values_1) set$$1(obj, key_1, values_1[key_1]);
        } finally {
          endBatch$$1();
        }

        return;
      }

      if (isObservableObject$$1(obj)) {
        var adm = obj[$mobx$$1];
        var existingObservable = adm.values.get(key);

        if (existingObservable) {
          adm.write(key, value);
        } else {
          adm.addObservableProp(key, value, adm.defaultEnhancer);
        }
      } else if (isObservableMap$$1(obj)) {
        obj.set(key, value);
      } else if (isObservableArray$$1(obj)) {
        if (typeof key !== "number") key = parseInt(key, 10);
        invariant$$1(key >= 0, "Not a valid index: '" + key + "'");
        startBatch$$1();
        if (key >= obj.length) obj.length = key + 1;
        obj[key] = value;
        endBatch$$1();
      } else {
        return fail$$1(process.env.NODE_ENV !== "production" && "'set()' can only be used on observable objects, arrays and maps");
      }
    }

    function trace$$1() {
      var args = [];

      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }

      var enterBreakPoint = false;
      if (typeof args[args.length - 1] === "boolean") enterBreakPoint = args.pop();
      var derivation = getAtomFromArgs(args);

      if (!derivation) {
        return fail$$1(process.env.NODE_ENV !== "production" && "'trace(break?)' can only be used inside a tracked computed value or a Reaction. Consider passing in the computed value or reaction explicitly");
      }

      if (derivation.isTracing === TraceMode$$1.NONE) {
        console.log("[mobx.trace] '" + derivation.name + "' tracing enabled");
      }

      derivation.isTracing = enterBreakPoint ? TraceMode$$1.BREAK : TraceMode$$1.LOG;
    }

    function getAtomFromArgs(args) {
      switch (args.length) {
        case 0:
          return globalState$$1.trackingDerivation;

        case 1:
          return getAtom$$1(args[0]);

        case 2:
          return getAtom$$1(args[0], args[1]);
      }
    }
    /**
     * During a transaction no views are updated until the end of the transaction.
     * The transaction will be run synchronously nonetheless.
     *
     * @param action a function that updates some reactive state
     * @returns any value that was returned by the 'action' parameter.
     */


    function transaction$$1(action$$1, thisArg) {
      if (thisArg === void 0) {
        thisArg = undefined;
      }

      startBatch$$1();

      try {
        return action$$1.apply(thisArg);
      } finally {
        endBatch$$1();
      }
    }

    function getAdm(target) {
      return target[$mobx$$1];
    } // Optimization: we don't need the intermediate objects and could have a completely custom administration for DynamicObjects,
    // and skip either the internal values map, or the base object with its property descriptors!


    var objectProxyTraps = {
      has: function (target, name) {
        if (name === $mobx$$1 || name === "constructor" || name === mobxDidRunLazyInitializersSymbol$$1) return true;
        var adm = getAdm(target); // MWE: should `in` operator be reactive? If not, below code path will be faster / more memory efficient
        // TODO: check performance stats!
        // if (adm.values.get(name as string)) return true

        if (typeof name === "string") return adm.has(name);
        return name in target;
      },
      get: function (target, name) {
        if (name === $mobx$$1 || name === "constructor" || name === mobxDidRunLazyInitializersSymbol$$1) return target[name];
        var adm = getAdm(target);
        var observable$$1 = adm.values.get(name);

        if (observable$$1 instanceof Atom$$1) {
          var result = observable$$1.get();

          if (result === undefined) {
            // This fixes #1796, because deleting a prop that has an
            // undefined value won't retrigger a observer (no visible effect),
            // the autorun wouldn't subscribe to future key changes (see also next comment)
            adm.has(name);
          }

          return result;
        } // make sure we start listening to future keys
        // note that we only do this here for optimization


        if (typeof name === "string") adm.has(name);
        return target[name];
      },
      set: function (target, name, value) {
        if (typeof name !== "string") return false;
        set$$1(target, name, value);
        return true;
      },
      deleteProperty: function (target, name) {
        if (typeof name !== "string") return false;
        var adm = getAdm(target);
        adm.remove(name);
        return true;
      },
      ownKeys: function (target) {
        var adm = getAdm(target);
        adm.keysAtom.reportObserved();
        return Reflect.ownKeys(target);
      },
      preventExtensions: function (target) {
        fail$$1("Dynamic observable objects cannot be frozen");
        return false;
      }
    };

    function createDynamicObservableObject$$1(base) {
      var proxy = new Proxy(base, objectProxyTraps);
      base[$mobx$$1].proxy = proxy;
      return proxy;
    }

    function hasInterceptors$$1(interceptable) {
      return interceptable.interceptors !== undefined && interceptable.interceptors.length > 0;
    }

    function registerInterceptor$$1(interceptable, handler) {
      var interceptors = interceptable.interceptors || (interceptable.interceptors = []);
      interceptors.push(handler);
      return once$$1(function () {
        var idx = interceptors.indexOf(handler);
        if (idx !== -1) interceptors.splice(idx, 1);
      });
    }

    function interceptChange$$1(interceptable, change) {
      var prevU = untrackedStart$$1();

      try {
        var interceptors = interceptable.interceptors;
        if (interceptors) for (var i = 0, l = interceptors.length; i < l; i++) {
          change = interceptors[i](change);
          invariant$$1(!change || change.type, "Intercept handlers should return nothing or a change object");
          if (!change) break;
        }
        return change;
      } finally {
        untrackedEnd$$1(prevU);
      }
    }

    function hasListeners$$1(listenable) {
      return listenable.changeListeners !== undefined && listenable.changeListeners.length > 0;
    }

    function registerListener$$1(listenable, handler) {
      var listeners = listenable.changeListeners || (listenable.changeListeners = []);
      listeners.push(handler);
      return once$$1(function () {
        var idx = listeners.indexOf(handler);
        if (idx !== -1) listeners.splice(idx, 1);
      });
    }

    function notifyListeners$$1(listenable, change) {
      var prevU = untrackedStart$$1();
      var listeners = listenable.changeListeners;
      if (!listeners) return;
      listeners = listeners.slice();

      for (var i = 0, l = listeners.length; i < l; i++) {
        listeners[i](change);
      }

      untrackedEnd$$1(prevU);
    }

    var MAX_SPLICE_SIZE = 10000; // See e.g. https://github.com/mobxjs/mobx/issues/859

    var arrayTraps = {
      get: function (target, name) {
        if (name === $mobx$$1) return target[$mobx$$1];
        if (name === "length") return target[$mobx$$1].getArrayLength();

        if (typeof name === "number") {
          return arrayExtensions.get.call(target, name);
        }

        if (typeof name === "string" && !isNaN(name)) {
          return arrayExtensions.get.call(target, parseInt(name));
        }

        if (arrayExtensions.hasOwnProperty(name)) {
          return arrayExtensions[name];
        }

        return target[name];
      },
      set: function (target, name, value) {
        if (name === "length") {
          target[$mobx$$1].setArrayLength(value);
          return true;
        }

        if (typeof name === "number") {
          arrayExtensions.set.call(target, name, value);
          return true;
        }

        if (!isNaN(name)) {
          arrayExtensions.set.call(target, parseInt(name), value);
          return true;
        }

        return false;
      },
      preventExtensions: function (target) {
        fail$$1("Observable arrays cannot be frozen");
        return false;
      }
    };

    function createObservableArray$$1(initialValues, enhancer, name, owned) {
      if (name === void 0) {
        name = "ObservableArray@" + getNextId$$1();
      }

      if (owned === void 0) {
        owned = false;
      }

      var adm = new ObservableArrayAdministration(name, enhancer, owned);
      addHiddenFinalProp$$1(adm.values, $mobx$$1, adm);
      var proxy = new Proxy(adm.values, arrayTraps);
      adm.proxy = proxy;

      if (initialValues && initialValues.length) {
        var prev = allowStateChangesStart$$1(true);
        adm.spliceWithArray(0, 0, initialValues);
        allowStateChangesEnd$$1(prev);
      }

      return proxy;
    }

    var ObservableArrayAdministration =
    /** @class */
    function () {
      function ObservableArrayAdministration(name, enhancer, owned) {
        this.owned = owned;
        this.values = [];
        this.proxy = undefined;
        this.lastKnownLength = 0;
        this.atom = new Atom$$1(name || "ObservableArray@" + getNextId$$1());

        this.enhancer = function (newV, oldV) {
          return enhancer(newV, oldV, name + "[..]");
        };
      }

      ObservableArrayAdministration.prototype.dehanceValue = function (value) {
        if (this.dehancer !== undefined) return this.dehancer(value);
        return value;
      };

      ObservableArrayAdministration.prototype.dehanceValues = function (values$$1) {
        if (this.dehancer !== undefined && values$$1.length > 0) return values$$1.map(this.dehancer);
        return values$$1;
      };

      ObservableArrayAdministration.prototype.intercept = function (handler) {
        return registerInterceptor$$1(this, handler);
      };

      ObservableArrayAdministration.prototype.observe = function (listener, fireImmediately) {
        if (fireImmediately === void 0) {
          fireImmediately = false;
        }

        if (fireImmediately) {
          listener({
            object: this.proxy,
            type: "splice",
            index: 0,
            added: this.values.slice(),
            addedCount: this.values.length,
            removed: [],
            removedCount: 0
          });
        }

        return registerListener$$1(this, listener);
      };

      ObservableArrayAdministration.prototype.getArrayLength = function () {
        this.atom.reportObserved();
        return this.values.length;
      };

      ObservableArrayAdministration.prototype.setArrayLength = function (newLength) {
        if (typeof newLength !== "number" || newLength < 0) throw new Error("[mobx.array] Out of range: " + newLength);
        var currentLength = this.values.length;
        if (newLength === currentLength) return;else if (newLength > currentLength) {
          var newItems = new Array(newLength - currentLength);

          for (var i = 0; i < newLength - currentLength; i++) newItems[i] = undefined; // No Array.fill everywhere...


          this.spliceWithArray(currentLength, 0, newItems);
        } else this.spliceWithArray(newLength, currentLength - newLength);
      };

      ObservableArrayAdministration.prototype.updateArrayLength = function (oldLength, delta) {
        if (oldLength !== this.lastKnownLength) throw new Error("[mobx] Modification exception: the internal structure of an observable array was changed.");
        this.lastKnownLength += delta;
      };

      ObservableArrayAdministration.prototype.spliceWithArray = function (index, deleteCount, newItems) {
        var _this = this;

        checkIfStateModificationsAreAllowed$$1(this.atom);
        var length = this.values.length;
        if (index === undefined) index = 0;else if (index > length) index = length;else if (index < 0) index = Math.max(0, length + index);
        if (arguments.length === 1) deleteCount = length - index;else if (deleteCount === undefined || deleteCount === null) deleteCount = 0;else deleteCount = Math.max(0, Math.min(deleteCount, length - index));
        if (newItems === undefined) newItems = EMPTY_ARRAY$$1;

        if (hasInterceptors$$1(this)) {
          var change = interceptChange$$1(this, {
            object: this.proxy,
            type: "splice",
            index: index,
            removedCount: deleteCount,
            added: newItems
          });
          if (!change) return EMPTY_ARRAY$$1;
          deleteCount = change.removedCount;
          newItems = change.added;
        }

        newItems = newItems.length === 0 ? newItems : newItems.map(function (v) {
          return _this.enhancer(v, undefined);
        });

        if (process.env.NODE_ENV !== "production") {
          var lengthDelta = newItems.length - deleteCount;
          this.updateArrayLength(length, lengthDelta); // checks if internal array wasn't modified
        }

        var res = this.spliceItemsIntoValues(index, deleteCount, newItems);
        if (deleteCount !== 0 || newItems.length !== 0) this.notifyArraySplice(index, newItems, res);
        return this.dehanceValues(res);
      };

      ObservableArrayAdministration.prototype.spliceItemsIntoValues = function (index, deleteCount, newItems) {
        var _a;

        if (newItems.length < MAX_SPLICE_SIZE) {
          return (_a = this.values).splice.apply(_a, __spread([index, deleteCount], newItems));
        } else {
          var res = this.values.slice(index, index + deleteCount);
          this.values = this.values.slice(0, index).concat(newItems, this.values.slice(index + deleteCount));
          return res;
        }
      };

      ObservableArrayAdministration.prototype.notifyArrayChildUpdate = function (index, newValue, oldValue) {
        var notifySpy = !this.owned && isSpyEnabled$$1();
        var notify = hasListeners$$1(this);
        var change = notify || notifySpy ? {
          object: this.proxy,
          type: "update",
          index: index,
          newValue: newValue,
          oldValue: oldValue
        } : null; // The reason why this is on right hand side here (and not above), is this way the uglifier will drop it, but it won't
        // cause any runtime overhead in development mode without NODE_ENV set, unless spying is enabled

        if (notifySpy && process.env.NODE_ENV !== "production") spyReportStart$$1(__assign({}, change, {
          name: this.atom.name
        }));
        this.atom.reportChanged();
        if (notify) notifyListeners$$1(this, change);
        if (notifySpy && process.env.NODE_ENV !== "production") spyReportEnd$$1();
      };

      ObservableArrayAdministration.prototype.notifyArraySplice = function (index, added, removed) {
        var notifySpy = !this.owned && isSpyEnabled$$1();
        var notify = hasListeners$$1(this);
        var change = notify || notifySpy ? {
          object: this.proxy,
          type: "splice",
          index: index,
          removed: removed,
          added: added,
          removedCount: removed.length,
          addedCount: added.length
        } : null;
        if (notifySpy && process.env.NODE_ENV !== "production") spyReportStart$$1(__assign({}, change, {
          name: this.atom.name
        }));
        this.atom.reportChanged(); // conform: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/observe

        if (notify) notifyListeners$$1(this, change);
        if (notifySpy && process.env.NODE_ENV !== "production") spyReportEnd$$1();
      };

      return ObservableArrayAdministration;
    }();

    var arrayExtensions = {
      intercept: function (handler) {
        return this[$mobx$$1].intercept(handler);
      },
      observe: function (listener, fireImmediately) {
        if (fireImmediately === void 0) {
          fireImmediately = false;
        }

        var adm = this[$mobx$$1];
        return adm.observe(listener, fireImmediately);
      },
      clear: function () {
        return this.splice(0);
      },
      replace: function (newItems) {
        var adm = this[$mobx$$1];
        return adm.spliceWithArray(0, adm.values.length, newItems);
      },

      /**
       * Converts this array back to a (shallow) javascript structure.
       * For a deep clone use mobx.toJS
       */
      toJS: function () {
        return this.slice();
      },
      toJSON: function () {
        // Used by JSON.stringify
        return this.toJS();
      },

      /*
       * functions that do alter the internal structure of the array, (based on lib.es6.d.ts)
       * since these functions alter the inner structure of the array, the have side effects.
       * Because the have side effects, they should not be used in computed function,
       * and for that reason the do not call dependencyState.notifyObserved
       */
      splice: function (index, deleteCount) {
        var newItems = [];

        for (var _i = 2; _i < arguments.length; _i++) {
          newItems[_i - 2] = arguments[_i];
        }

        var adm = this[$mobx$$1];

        switch (arguments.length) {
          case 0:
            return [];

          case 1:
            return adm.spliceWithArray(index);

          case 2:
            return adm.spliceWithArray(index, deleteCount);
        }

        return adm.spliceWithArray(index, deleteCount, newItems);
      },
      spliceWithArray: function (index, deleteCount, newItems) {
        var adm = this[$mobx$$1];
        return adm.spliceWithArray(index, deleteCount, newItems);
      },
      push: function () {
        var items = [];

        for (var _i = 0; _i < arguments.length; _i++) {
          items[_i] = arguments[_i];
        }

        var adm = this[$mobx$$1];
        adm.spliceWithArray(adm.values.length, 0, items);
        return adm.values.length;
      },
      pop: function () {
        return this.splice(Math.max(this[$mobx$$1].values.length - 1, 0), 1)[0];
      },
      shift: function () {
        return this.splice(0, 1)[0];
      },
      unshift: function () {
        var items = [];

        for (var _i = 0; _i < arguments.length; _i++) {
          items[_i] = arguments[_i];
        }

        var adm = this[$mobx$$1];
        adm.spliceWithArray(0, 0, items);
        return adm.values.length;
      },
      reverse: function () {
        // reverse by default mutates in place before returning the result
        // which makes it both a 'derivation' and a 'mutation'.
        // so we deviate from the default and just make it an dervitation
        if (process.env.NODE_ENV !== "production") {
          console.warn("[mobx] `observableArray.reverse()` will not update the array in place. Use `observableArray.slice().reverse()` to supress this warning and perform the operation on a copy, or `observableArray.replace(observableArray.slice().reverse())` to reverse & update in place");
        }

        var clone = this.slice();
        return clone.reverse.apply(clone, arguments);
      },
      sort: function (compareFn) {
        // sort by default mutates in place before returning the result
        // which goes against all good practices. Let's not change the array in place!
        if (process.env.NODE_ENV !== "production") {
          console.warn("[mobx] `observableArray.sort()` will not update the array in place. Use `observableArray.slice().sort()` to supress this warning and perform the operation on a copy, or `observableArray.replace(observableArray.slice().sort())` to sort & update in place");
        }

        var clone = this.slice();
        return clone.sort.apply(clone, arguments);
      },
      remove: function (value) {
        var adm = this[$mobx$$1];
        var idx = adm.dehanceValues(adm.values).indexOf(value);

        if (idx > -1) {
          this.splice(idx, 1);
          return true;
        }

        return false;
      },
      get: function (index) {
        var adm = this[$mobx$$1];

        if (adm) {
          if (index < adm.values.length) {
            adm.atom.reportObserved();
            return adm.dehanceValue(adm.values[index]);
          }

          console.warn("[mobx.array] Attempt to read an array index (" + index + ") that is out of bounds (" + adm.values.length + "). Please check length first. Out of bound indices will not be tracked by MobX");
        }

        return undefined;
      },
      set: function (index, newValue) {
        var adm = this[$mobx$$1];
        var values$$1 = adm.values;

        if (index < values$$1.length) {
          // update at index in range
          checkIfStateModificationsAreAllowed$$1(adm.atom);
          var oldValue = values$$1[index];

          if (hasInterceptors$$1(adm)) {
            var change = interceptChange$$1(adm, {
              type: "update",
              object: this,
              index: index,
              newValue: newValue
            });
            if (!change) return;
            newValue = change.newValue;
          }

          newValue = adm.enhancer(newValue, oldValue);
          var changed = newValue !== oldValue;

          if (changed) {
            values$$1[index] = newValue;
            adm.notifyArrayChildUpdate(index, newValue, oldValue);
          }
        } else if (index === values$$1.length) {
          // add a new item
          adm.spliceWithArray(index, 0, [newValue]);
        } else {
          // out of bounds
          throw new Error("[mobx.array] Index out of bounds, " + index + " is larger than " + values$$1.length);
        }
      }
    };
    ["concat", "every", "filter", "forEach", "indexOf", "join", "lastIndexOf", "map", "reduce", "reduceRight", "slice", "some", "toString", "toLocaleString"].forEach(function (funcName) {
      arrayExtensions[funcName] = function () {
        var adm = this[$mobx$$1];
        adm.atom.reportObserved();
        var res = adm.dehanceValues(adm.values);
        return res[funcName].apply(res, arguments);
      };
    });
    var isObservableArrayAdministration = createInstanceofPredicate$$1("ObservableArrayAdministration", ObservableArrayAdministration);

    function isObservableArray$$1(thing) {
      return isObject$$1(thing) && isObservableArrayAdministration(thing[$mobx$$1]);
    }

    var _a;

    var ObservableMapMarker = {}; // just extend Map? See also https://gist.github.com/nestharus/13b4d74f2ef4a2f4357dbd3fc23c1e54
    // But: https://github.com/mobxjs/mobx/issues/1556

    var ObservableMap$$1 =
    /** @class */
    function () {
      function ObservableMap$$1(initialData, enhancer, name) {
        if (enhancer === void 0) {
          enhancer = deepEnhancer$$1;
        }

        if (name === void 0) {
          name = "ObservableMap@" + getNextId$$1();
        }

        this.enhancer = enhancer;
        this.name = name;
        this[_a] = ObservableMapMarker;
        this._keysAtom = createAtom$$1(this.name + ".keys()");
        this[Symbol.toStringTag] = "Map";

        if (typeof Map !== "function") {
          throw new Error("mobx.map requires Map polyfill for the current browser. Check babel-polyfill or core-js/es6/map.js");
        }

        this._data = new Map();
        this._hasMap = new Map();
        this.merge(initialData);
      }

      ObservableMap$$1.prototype._has = function (key) {
        return this._data.has(key);
      };

      ObservableMap$$1.prototype.has = function (key) {
        if (this._hasMap.has(key)) return this._hasMap.get(key).get();
        return this._updateHasMapEntry(key, false).get();
      };

      ObservableMap$$1.prototype.set = function (key, value) {
        var hasKey = this._has(key);

        if (hasInterceptors$$1(this)) {
          var change = interceptChange$$1(this, {
            type: hasKey ? "update" : "add",
            object: this,
            newValue: value,
            name: key
          });
          if (!change) return this;
          value = change.newValue;
        }

        if (hasKey) {
          this._updateValue(key, value);
        } else {
          this._addValue(key, value);
        }

        return this;
      };

      ObservableMap$$1.prototype.delete = function (key) {
        var _this = this;

        if (hasInterceptors$$1(this)) {
          var change = interceptChange$$1(this, {
            type: "delete",
            object: this,
            name: key
          });
          if (!change) return false;
        }

        if (this._has(key)) {
          var notifySpy = isSpyEnabled$$1();
          var notify = hasListeners$$1(this);
          var change = notify || notifySpy ? {
            type: "delete",
            object: this,
            oldValue: this._data.get(key).value,
            name: key
          } : null;
          if (notifySpy && process.env.NODE_ENV !== "production") spyReportStart$$1(__assign({}, change, {
            name: this.name,
            key: key
          }));
          transaction$$1(function () {
            _this._keysAtom.reportChanged();

            _this._updateHasMapEntry(key, false);

            var observable$$1 = _this._data.get(key);

            observable$$1.setNewValue(undefined);

            _this._data.delete(key);
          });
          if (notify) notifyListeners$$1(this, change);
          if (notifySpy && process.env.NODE_ENV !== "production") spyReportEnd$$1();
          return true;
        }

        return false;
      };

      ObservableMap$$1.prototype._updateHasMapEntry = function (key, value) {
        // optimization; don't fill the hasMap if we are not observing, or remove entry if there are no observers anymore
        var entry = this._hasMap.get(key);

        if (entry) {
          entry.setNewValue(value);
        } else {
          entry = new ObservableValue$$1(value, referenceEnhancer$$1, this.name + "." + stringifyKey(key) + "?", false);

          this._hasMap.set(key, entry);
        }

        return entry;
      };

      ObservableMap$$1.prototype._updateValue = function (key, newValue) {
        var observable$$1 = this._data.get(key);

        newValue = observable$$1.prepareNewValue(newValue);

        if (newValue !== globalState$$1.UNCHANGED) {
          var notifySpy = isSpyEnabled$$1();
          var notify = hasListeners$$1(this);
          var change = notify || notifySpy ? {
            type: "update",
            object: this,
            oldValue: observable$$1.value,
            name: key,
            newValue: newValue
          } : null;
          if (notifySpy && process.env.NODE_ENV !== "production") spyReportStart$$1(__assign({}, change, {
            name: this.name,
            key: key
          }));
          observable$$1.setNewValue(newValue);
          if (notify) notifyListeners$$1(this, change);
          if (notifySpy && process.env.NODE_ENV !== "production") spyReportEnd$$1();
        }
      };

      ObservableMap$$1.prototype._addValue = function (key, newValue) {
        var _this = this;

        checkIfStateModificationsAreAllowed$$1(this._keysAtom);
        transaction$$1(function () {
          var observable$$1 = new ObservableValue$$1(newValue, _this.enhancer, _this.name + "." + stringifyKey(key), false);

          _this._data.set(key, observable$$1);

          newValue = observable$$1.value; // value might have been changed

          _this._updateHasMapEntry(key, true);

          _this._keysAtom.reportChanged();
        });
        var notifySpy = isSpyEnabled$$1();
        var notify = hasListeners$$1(this);
        var change = notify || notifySpy ? {
          type: "add",
          object: this,
          name: key,
          newValue: newValue
        } : null;
        if (notifySpy && process.env.NODE_ENV !== "production") spyReportStart$$1(__assign({}, change, {
          name: this.name,
          key: key
        }));
        if (notify) notifyListeners$$1(this, change);
        if (notifySpy && process.env.NODE_ENV !== "production") spyReportEnd$$1();
      };

      ObservableMap$$1.prototype.get = function (key) {
        if (this.has(key)) return this.dehanceValue(this._data.get(key).get());
        return this.dehanceValue(undefined);
      };

      ObservableMap$$1.prototype.dehanceValue = function (value) {
        if (this.dehancer !== undefined) {
          return this.dehancer(value);
        }

        return value;
      };

      ObservableMap$$1.prototype.keys = function () {
        this._keysAtom.reportObserved();

        return this._data.keys();
      };

      ObservableMap$$1.prototype.values = function () {
        var self = this;
        var nextIndex = 0;
        var keys$$1 = Array.from(this.keys());
        return makeIterable({
          next: function () {
            return nextIndex < keys$$1.length ? {
              value: self.get(keys$$1[nextIndex++]),
              done: false
            } : {
              done: true
            };
          }
        });
      };

      ObservableMap$$1.prototype.entries = function () {
        var self = this;
        var nextIndex = 0;
        var keys$$1 = Array.from(this.keys());
        return makeIterable({
          next: function () {
            if (nextIndex < keys$$1.length) {
              var key = keys$$1[nextIndex++];
              return {
                value: [key, self.get(key)],
                done: false
              };
            }

            return {
              done: true
            };
          }
        });
      };

      ObservableMap$$1.prototype[(_a = $mobx$$1, Symbol.iterator)] = function () {
        return this.entries();
      };

      ObservableMap$$1.prototype.forEach = function (callback, thisArg) {
        var e_1, _a;

        try {
          for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
            var _d = __read(_c.value, 2),
                key = _d[0],
                value = _d[1];

            callback.call(thisArg, value, key, this);
          }
        } catch (e_1_1) {
          e_1 = {
            error: e_1_1
          };
        } finally {
          try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
          } finally {
            if (e_1) throw e_1.error;
          }
        }
      };
      /** Merge another object into this object, returns this. */


      ObservableMap$$1.prototype.merge = function (other) {
        var _this = this;

        if (isObservableMap$$1(other)) {
          other = other.toJS();
        }

        transaction$$1(function () {
          if (isPlainObject$$1(other)) Object.keys(other).forEach(function (key) {
            return _this.set(key, other[key]);
          });else if (Array.isArray(other)) other.forEach(function (_a) {
            var _b = __read(_a, 2),
                key = _b[0],
                value = _b[1];

            return _this.set(key, value);
          });else if (isES6Map$$1(other)) {
            if (other.constructor !== Map) fail$$1("Cannot initialize from classes that inherit from Map: " + other.constructor.name); // prettier-ignore

            other.forEach(function (value, key) {
              return _this.set(key, value);
            });
          } else if (other !== null && other !== undefined) fail$$1("Cannot initialize map from " + other);
        });
        return this;
      };

      ObservableMap$$1.prototype.clear = function () {
        var _this = this;

        transaction$$1(function () {
          untracked$$1(function () {
            var e_2, _a;

            try {
              for (var _b = __values(_this.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var key = _c.value;

                _this.delete(key);
              }
            } catch (e_2_1) {
              e_2 = {
                error: e_2_1
              };
            } finally {
              try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
              } finally {
                if (e_2) throw e_2.error;
              }
            }
          });
        });
      };

      ObservableMap$$1.prototype.replace = function (values$$1) {
        var _this = this;

        transaction$$1(function () {
          // grab all the keys that are present in the new map but not present in the current map
          // and delete them from the map, then merge the new map
          // this will cause reactions only on changed values
          var newKeys = getMapLikeKeys$$1(values$$1);
          var oldKeys = Array.from(_this.keys());
          var missingKeys = oldKeys.filter(function (k) {
            return newKeys.indexOf(k) === -1;
          });
          missingKeys.forEach(function (k) {
            return _this.delete(k);
          });

          _this.merge(values$$1);
        });
        return this;
      };

      Object.defineProperty(ObservableMap$$1.prototype, "size", {
        get: function () {
          this._keysAtom.reportObserved();

          return this._data.size;
        },
        enumerable: true,
        configurable: true
      });
      /**
       * Returns a plain object that represents this map.
       * Note that all the keys being stringified.
       * If there are duplicating keys after converting them to strings, behaviour is undetermined.
       */

      ObservableMap$$1.prototype.toPOJO = function () {
        var e_3, _a;

        var res = {};

        try {
          for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
            var _d = __read(_c.value, 2),
                key = _d[0],
                value = _d[1]; // We lie about symbol key types due to https://github.com/Microsoft/TypeScript/issues/1863


            res[typeof key === "symbol" ? key : stringifyKey(key)] = value;
          }
        } catch (e_3_1) {
          e_3 = {
            error: e_3_1
          };
        } finally {
          try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
          } finally {
            if (e_3) throw e_3.error;
          }
        }

        return res;
      };
      /**
       * Returns a shallow non observable object clone of this map.
       * Note that the values migth still be observable. For a deep clone use mobx.toJS.
       */


      ObservableMap$$1.prototype.toJS = function () {
        return new Map(this);
      };

      ObservableMap$$1.prototype.toJSON = function () {
        // Used by JSON.stringify
        return this.toPOJO();
      };

      ObservableMap$$1.prototype.toString = function () {
        var _this = this;

        return this.name + "[{ " + Array.from(this.keys()).map(function (key) {
          return stringifyKey(key) + ": " + ("" + _this.get(key));
        }).join(", ") + " }]";
      };
      /**
       * Observes this object. Triggers for the events 'add', 'update' and 'delete'.
       * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/observe
       * for callback details
       */


      ObservableMap$$1.prototype.observe = function (listener, fireImmediately) {
        process.env.NODE_ENV !== "production" && invariant$$1(fireImmediately !== true, "`observe` doesn't support fireImmediately=true in combination with maps.");
        return registerListener$$1(this, listener);
      };

      ObservableMap$$1.prototype.intercept = function (handler) {
        return registerInterceptor$$1(this, handler);
      };

      return ObservableMap$$1;
    }();

    function stringifyKey(key) {
      if (key && key.toString) return key.toString();else return new String(key).toString();
    }
    /* 'var' fixes small-build issue */


    var isObservableMap$$1 = createInstanceofPredicate$$1("ObservableMap", ObservableMap$$1);

    var _a$1;

    var ObservableSetMarker = {};

    var ObservableSet$$1 =
    /** @class */
    function () {
      function ObservableSet$$1(initialData, enhancer, name) {
        if (enhancer === void 0) {
          enhancer = deepEnhancer$$1;
        }

        if (name === void 0) {
          name = "ObservableSet@" + getNextId$$1();
        }

        this.name = name;
        this[_a$1] = ObservableSetMarker;
        this._data = new Set();
        this._atom = createAtom$$1(this.name);
        this[Symbol.toStringTag] = "Set";

        if (typeof Set !== "function") {
          throw new Error("mobx.set requires Set polyfill for the current browser. Check babel-polyfill or core-js/es6/set.js");
        }

        this.enhancer = function (newV, oldV) {
          return enhancer(newV, oldV, name);
        };

        if (initialData) {
          this.replace(initialData);
        }
      }

      ObservableSet$$1.prototype.dehanceValue = function (value) {
        if (this.dehancer !== undefined) {
          return this.dehancer(value);
        }

        return value;
      };

      ObservableSet$$1.prototype.clear = function () {
        var _this = this;

        transaction$$1(function () {
          untracked$$1(function () {
            var e_1, _a;

            try {
              for (var _b = __values(_this._data.values()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var value = _c.value;

                _this.delete(value);
              }
            } catch (e_1_1) {
              e_1 = {
                error: e_1_1
              };
            } finally {
              try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
              } finally {
                if (e_1) throw e_1.error;
              }
            }
          });
        });
      };

      ObservableSet$$1.prototype.forEach = function (callbackFn, thisArg) {
        var e_2, _a;

        try {
          for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
            var value = _c.value;
            callbackFn.call(thisArg, value, value, this);
          }
        } catch (e_2_1) {
          e_2 = {
            error: e_2_1
          };
        } finally {
          try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
          } finally {
            if (e_2) throw e_2.error;
          }
        }
      };

      Object.defineProperty(ObservableSet$$1.prototype, "size", {
        get: function () {
          this._atom.reportObserved();

          return this._data.size;
        },
        enumerable: true,
        configurable: true
      });

      ObservableSet$$1.prototype.add = function (value) {
        var _this = this;

        checkIfStateModificationsAreAllowed$$1(this._atom);

        if (hasInterceptors$$1(this)) {
          var change = interceptChange$$1(this, {
            type: "add",
            object: this,
            newValue: value
          });
          if (!change) return this; // TODO: ideally, value = change.value would be done here, so that values can be
          // changed by interceptor. Same applies for other Set and Map api's.
        }

        if (!this.has(value)) {
          transaction$$1(function () {
            _this._data.add(_this.enhancer(value, undefined));

            _this._atom.reportChanged();
          });
          var notifySpy = isSpyEnabled$$1();
          var notify = hasListeners$$1(this);
          var change = notify || notifySpy ? {
            type: "add",
            object: this,
            newValue: value
          } : null;
          if (notifySpy && process.env.NODE_ENV !== "production") spyReportStart$$1(change);
          if (notify) notifyListeners$$1(this, change);
          if (notifySpy && process.env.NODE_ENV !== "production") spyReportEnd$$1();
        }

        return this;
      };

      ObservableSet$$1.prototype.delete = function (value) {
        var _this = this;

        if (hasInterceptors$$1(this)) {
          var change = interceptChange$$1(this, {
            type: "delete",
            object: this,
            oldValue: value
          });
          if (!change) return false;
        }

        if (this.has(value)) {
          var notifySpy = isSpyEnabled$$1();
          var notify = hasListeners$$1(this);
          var change = notify || notifySpy ? {
            type: "delete",
            object: this,
            oldValue: value
          } : null;
          if (notifySpy && process.env.NODE_ENV !== "production") spyReportStart$$1(__assign({}, change, {
            name: this.name
          }));
          transaction$$1(function () {
            _this._atom.reportChanged();

            _this._data.delete(value);
          });
          if (notify) notifyListeners$$1(this, change);
          if (notifySpy && process.env.NODE_ENV !== "production") spyReportEnd$$1();
          return true;
        }

        return false;
      };

      ObservableSet$$1.prototype.has = function (value) {
        this._atom.reportObserved();

        return this._data.has(this.dehanceValue(value));
      };

      ObservableSet$$1.prototype.entries = function () {
        var nextIndex = 0;
        var keys$$1 = Array.from(this.keys());
        var values$$1 = Array.from(this.values());
        return makeIterable({
          next: function () {
            var index = nextIndex;
            nextIndex += 1;
            return index < values$$1.length ? {
              value: [keys$$1[index], values$$1[index]],
              done: false
            } : {
              done: true
            };
          }
        });
      };

      ObservableSet$$1.prototype.keys = function () {
        return this.values();
      };

      ObservableSet$$1.prototype.values = function () {
        this._atom.reportObserved();

        var self = this;
        var nextIndex = 0;
        var observableValues = Array.from(this._data.values());
        return makeIterable({
          next: function () {
            return nextIndex < observableValues.length ? {
              value: self.dehanceValue(observableValues[nextIndex++]),
              done: false
            } : {
              done: true
            };
          }
        });
      };

      ObservableSet$$1.prototype.replace = function (other) {
        var _this = this;

        if (isObservableSet$$1(other)) {
          other = other.toJS();
        }

        transaction$$1(function () {
          if (Array.isArray(other)) {
            _this.clear();

            other.forEach(function (value) {
              return _this.add(value);
            });
          } else if (isES6Set$$1(other)) {
            _this.clear();

            other.forEach(function (value) {
              return _this.add(value);
            });
          } else if (other !== null && other !== undefined) {
            fail$$1("Cannot initialize set from " + other);
          }
        });
        return this;
      };

      ObservableSet$$1.prototype.observe = function (listener, fireImmediately) {
        // TODO 'fireImmediately' can be true?
        process.env.NODE_ENV !== "production" && invariant$$1(fireImmediately !== true, "`observe` doesn't support fireImmediately=true in combination with sets.");
        return registerListener$$1(this, listener);
      };

      ObservableSet$$1.prototype.intercept = function (handler) {
        return registerInterceptor$$1(this, handler);
      };

      ObservableSet$$1.prototype.toJS = function () {
        return new Set(this);
      };

      ObservableSet$$1.prototype.toString = function () {
        return this.name + "[ " + Array.from(this).join(", ") + " ]";
      };

      ObservableSet$$1.prototype[(_a$1 = $mobx$$1, Symbol.iterator)] = function () {
        return this.values();
      };

      return ObservableSet$$1;
    }();

    var isObservableSet$$1 = createInstanceofPredicate$$1("ObservableSet", ObservableSet$$1);

    var ObservableObjectAdministration$$1 =
    /** @class */
    function () {
      function ObservableObjectAdministration$$1(target, values$$1, name, defaultEnhancer) {
        if (values$$1 === void 0) {
          values$$1 = new Map();
        }

        this.target = target;
        this.values = values$$1;
        this.name = name;
        this.defaultEnhancer = defaultEnhancer;
        this.keysAtom = new Atom$$1(name + ".keys");
      }

      ObservableObjectAdministration$$1.prototype.read = function (key) {
        return this.values.get(key).get();
      };

      ObservableObjectAdministration$$1.prototype.write = function (key, newValue) {
        var instance = this.target;
        var observable$$1 = this.values.get(key);

        if (observable$$1 instanceof ComputedValue$$1) {
          observable$$1.set(newValue);
          return;
        } // intercept


        if (hasInterceptors$$1(this)) {
          var change = interceptChange$$1(this, {
            type: "update",
            object: this.proxy || instance,
            name: key,
            newValue: newValue
          });
          if (!change) return;
          newValue = change.newValue;
        }

        newValue = observable$$1.prepareNewValue(newValue); // notify spy & observers

        if (newValue !== globalState$$1.UNCHANGED) {
          var notify = hasListeners$$1(this);
          var notifySpy = isSpyEnabled$$1();
          var change = notify || notifySpy ? {
            type: "update",
            object: this.proxy || instance,
            oldValue: observable$$1.value,
            name: key,
            newValue: newValue
          } : null;
          if (notifySpy && process.env.NODE_ENV !== "production") spyReportStart$$1(__assign({}, change, {
            name: this.name,
            key: key
          }));
          observable$$1.setNewValue(newValue);
          if (notify) notifyListeners$$1(this, change);
          if (notifySpy && process.env.NODE_ENV !== "production") spyReportEnd$$1();
        }
      };

      ObservableObjectAdministration$$1.prototype.has = function (key) {
        var map = this.pendingKeys || (this.pendingKeys = new Map());
        var entry = map.get(key);
        if (entry) return entry.get();else {
          var exists = !!this.values.get(key); // Possible optimization: Don't have a separate map for non existing keys,
          // but store them in the values map instead, using a special symbol to denote "not existing"

          entry = new ObservableValue$$1(exists, referenceEnhancer$$1, this.name + "." + key.toString() + "?", false);
          map.set(key, entry);
          return entry.get(); // read to subscribe
        }
      };

      ObservableObjectAdministration$$1.prototype.addObservableProp = function (propName, newValue, enhancer) {
        if (enhancer === void 0) {
          enhancer = this.defaultEnhancer;
        }

        var target = this.target;
        assertPropertyConfigurable$$1(target, propName);

        if (hasInterceptors$$1(this)) {
          var change = interceptChange$$1(this, {
            object: this.proxy || target,
            name: propName,
            type: "add",
            newValue: newValue
          });
          if (!change) return;
          newValue = change.newValue;
        }

        var observable$$1 = new ObservableValue$$1(newValue, enhancer, this.name + "." + propName, false);
        this.values.set(propName, observable$$1);
        newValue = observable$$1.value; // observableValue might have changed it

        Object.defineProperty(target, propName, generateObservablePropConfig$$1(propName));
        this.notifyPropertyAddition(propName, newValue);
      };

      ObservableObjectAdministration$$1.prototype.addComputedProp = function (propertyOwner, // where is the property declared?
      propName, options) {
        var target = this.target;
        options.name = options.name || this.name + "." + propName;
        this.values.set(propName, new ComputedValue$$1(options));
        if (propertyOwner === target || isPropertyConfigurable$$1(propertyOwner, propName)) Object.defineProperty(propertyOwner, propName, generateComputedPropConfig$$1(propName));
      };

      ObservableObjectAdministration$$1.prototype.remove = function (key) {
        if (!this.values.has(key)) return;
        var target = this.target;

        if (hasInterceptors$$1(this)) {
          var change = interceptChange$$1(this, {
            object: this.proxy || target,
            name: key,
            type: "remove"
          });
          if (!change) return;
        }

        try {
          startBatch$$1();
          var notify = hasListeners$$1(this);
          var notifySpy = isSpyEnabled$$1();
          var oldObservable = this.values.get(key);
          var oldValue = oldObservable && oldObservable.get();
          oldObservable && oldObservable.set(undefined); // notify key and keyset listeners

          this.keysAtom.reportChanged();
          this.values.delete(key);

          if (this.pendingKeys) {
            var entry = this.pendingKeys.get(key);
            if (entry) entry.set(false);
          } // delete the prop


          delete this.target[key];
          var change = notify || notifySpy ? {
            type: "remove",
            object: this.proxy || target,
            oldValue: oldValue,
            name: key
          } : null;
          if (notifySpy && process.env.NODE_ENV !== "production") spyReportStart$$1(__assign({}, change, {
            name: this.name,
            key: key
          }));
          if (notify) notifyListeners$$1(this, change);
          if (notifySpy && process.env.NODE_ENV !== "production") spyReportEnd$$1();
        } finally {
          endBatch$$1();
        }
      };

      ObservableObjectAdministration$$1.prototype.illegalAccess = function (owner, propName) {
        /**
         * This happens if a property is accessed through the prototype chain, but the property was
         * declared directly as own property on the prototype.
         *
         * E.g.:
         * class A {
         * }
         * extendObservable(A.prototype, { x: 1 })
         *
         * classB extens A {
         * }
         * console.log(new B().x)
         *
         * It is unclear whether the property should be considered 'static' or inherited.
         * Either use `console.log(A.x)`
         * or: decorate(A, { x: observable })
         *
         * When using decorate, the property will always be redeclared as own property on the actual instance
         */
        console.warn("Property '" + propName + "' of '" + owner + "' was accessed through the prototype chain. Use 'decorate' instead to declare the prop or access it statically through it's owner");
      };
      /**
       * Observes this object. Triggers for the events 'add', 'update' and 'delete'.
       * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/observe
       * for callback details
       */


      ObservableObjectAdministration$$1.prototype.observe = function (callback, fireImmediately) {
        process.env.NODE_ENV !== "production" && invariant$$1(fireImmediately !== true, "`observe` doesn't support the fire immediately property for observable objects.");
        return registerListener$$1(this, callback);
      };

      ObservableObjectAdministration$$1.prototype.intercept = function (handler) {
        return registerInterceptor$$1(this, handler);
      };

      ObservableObjectAdministration$$1.prototype.notifyPropertyAddition = function (key, newValue) {
        var notify = hasListeners$$1(this);
        var notifySpy = isSpyEnabled$$1();
        var change = notify || notifySpy ? {
          type: "add",
          object: this.proxy || this.target,
          name: key,
          newValue: newValue
        } : null;
        if (notifySpy && process.env.NODE_ENV !== "production") spyReportStart$$1(__assign({}, change, {
          name: this.name,
          key: key
        }));
        if (notify) notifyListeners$$1(this, change);
        if (notifySpy && process.env.NODE_ENV !== "production") spyReportEnd$$1();

        if (this.pendingKeys) {
          var entry = this.pendingKeys.get(key);
          if (entry) entry.set(true);
        }

        this.keysAtom.reportChanged();
      };

      ObservableObjectAdministration$$1.prototype.getKeys = function () {
        var e_1, _a;

        this.keysAtom.reportObserved(); // return Reflect.ownKeys(this.values) as any

        var res = [];

        try {
          for (var _b = __values(this.values), _c = _b.next(); !_c.done; _c = _b.next()) {
            var _d = __read(_c.value, 2),
                key = _d[0],
                value = _d[1];

            if (value instanceof ObservableValue$$1) res.push(key);
          }
        } catch (e_1_1) {
          e_1 = {
            error: e_1_1
          };
        } finally {
          try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
          } finally {
            if (e_1) throw e_1.error;
          }
        }

        return res;
      };

      return ObservableObjectAdministration$$1;
    }();

    function asObservableObject$$1(target, name, defaultEnhancer) {
      if (name === void 0) {
        name = "";
      }

      if (defaultEnhancer === void 0) {
        defaultEnhancer = deepEnhancer$$1;
      }

      if (Object.prototype.hasOwnProperty.call(target, $mobx$$1)) return target[$mobx$$1];
      process.env.NODE_ENV !== "production" && invariant$$1(Object.isExtensible(target), "Cannot make the designated object observable; it is not extensible");
      if (!isPlainObject$$1(target)) name = (target.constructor.name || "ObservableObject") + "@" + getNextId$$1();
      if (!name) name = "ObservableObject@" + getNextId$$1();
      var adm = new ObservableObjectAdministration$$1(target, new Map(), name, defaultEnhancer);
      addHiddenProp$$1(target, $mobx$$1, adm);
      return adm;
    }

    var observablePropertyConfigs = Object.create(null);
    var computedPropertyConfigs = Object.create(null);

    function generateObservablePropConfig$$1(propName) {
      return observablePropertyConfigs[propName] || (observablePropertyConfigs[propName] = {
        configurable: true,
        enumerable: true,
        get: function () {
          return this[$mobx$$1].read(propName);
        },
        set: function (v) {
          this[$mobx$$1].write(propName, v);
        }
      });
    }

    function getAdministrationForComputedPropOwner(owner) {
      var adm = owner[$mobx$$1];

      if (!adm) {
        // because computed props are declared on proty,
        // the current instance might not have been initialized yet
        initializeInstance$$1(owner);
        return owner[$mobx$$1];
      }

      return adm;
    }

    function generateComputedPropConfig$$1(propName) {
      return computedPropertyConfigs[propName] || (computedPropertyConfigs[propName] = {
        configurable: false,
        enumerable: false,
        get: function () {
          return getAdministrationForComputedPropOwner(this).read(propName);
        },
        set: function (v) {
          getAdministrationForComputedPropOwner(this).write(propName, v);
        }
      });
    }

    var isObservableObjectAdministration = createInstanceofPredicate$$1("ObservableObjectAdministration", ObservableObjectAdministration$$1);

    function isObservableObject$$1(thing) {
      if (isObject$$1(thing)) {
        // Initializers run lazily when transpiling to babel, so make sure they are run...
        initializeInstance$$1(thing);
        return isObservableObjectAdministration(thing[$mobx$$1]);
      }

      return false;
    }

    function getAtom$$1(thing, property) {
      if (typeof thing === "object" && thing !== null) {
        if (isObservableArray$$1(thing)) {
          if (property !== undefined) fail$$1(process.env.NODE_ENV !== "production" && "It is not possible to get index atoms from arrays");
          return thing[$mobx$$1].atom;
        }

        if (isObservableSet$$1(thing)) {
          return thing[$mobx$$1];
        }

        if (isObservableMap$$1(thing)) {
          var anyThing = thing;
          if (property === undefined) return anyThing._keysAtom;

          var observable$$1 = anyThing._data.get(property) || anyThing._hasMap.get(property);

          if (!observable$$1) fail$$1(process.env.NODE_ENV !== "production" && "the entry '" + property + "' does not exist in the observable map '" + getDebugName$$1(thing) + "'");
          return observable$$1;
        } // Initializers run lazily when transpiling to babel, so make sure they are run...


        initializeInstance$$1(thing);
        if (property && !thing[$mobx$$1]) thing[property]; // See #1072

        if (isObservableObject$$1(thing)) {
          if (!property) return fail$$1(process.env.NODE_ENV !== "production" && "please specify a property");
          var observable$$1 = thing[$mobx$$1].values.get(property);
          if (!observable$$1) fail$$1(process.env.NODE_ENV !== "production" && "no observable property '" + property + "' found on the observable object '" + getDebugName$$1(thing) + "'");
          return observable$$1;
        }

        if (isAtom$$1(thing) || isComputedValue$$1(thing) || isReaction$$1(thing)) {
          return thing;
        }
      } else if (typeof thing === "function") {
        if (isReaction$$1(thing[$mobx$$1])) {
          // disposer function
          return thing[$mobx$$1];
        }
      }

      return fail$$1(process.env.NODE_ENV !== "production" && "Cannot obtain atom from " + thing);
    }

    function getAdministration$$1(thing, property) {
      if (!thing) fail$$1("Expecting some object");
      if (property !== undefined) return getAdministration$$1(getAtom$$1(thing, property));
      if (isAtom$$1(thing) || isComputedValue$$1(thing) || isReaction$$1(thing)) return thing;
      if (isObservableMap$$1(thing) || isObservableSet$$1(thing)) return thing; // Initializers run lazily when transpiling to babel, so make sure they are run...

      initializeInstance$$1(thing);
      if (thing[$mobx$$1]) return thing[$mobx$$1];
      fail$$1(process.env.NODE_ENV !== "production" && "Cannot obtain administration from " + thing);
    }

    function getDebugName$$1(thing, property) {
      var named;
      if (property !== undefined) named = getAtom$$1(thing, property);else if (isObservableObject$$1(thing) || isObservableMap$$1(thing) || isObservableSet$$1(thing)) named = getAdministration$$1(thing);else named = getAtom$$1(thing); // valid for arrays as well

      return named.name;
    }

    var toString = Object.prototype.toString;

    function deepEqual$$1(a, b) {
      return eq(a, b);
    } // Copied from https://github.com/jashkenas/underscore/blob/5c237a7c682fb68fd5378203f0bf22dce1624854/underscore.js#L1186-L1289
    // Internal recursive comparison function for `isEqual`.


    function eq(a, b, aStack, bStack) {
      // Identical objects are equal. `0 === -0`, but they aren't identical.
      // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
      if (a === b) return a !== 0 || 1 / a === 1 / b; // `null` or `undefined` only equal to itself (strict comparison).

      if (a == null || b == null) return false; // `NaN`s are equivalent, but non-reflexive.

      if (a !== a) return b !== b; // Exhaust primitive checks

      var type = typeof a;
      if (type !== "function" && type !== "object" && typeof b != "object") return false;
      return deepEq(a, b, aStack, bStack);
    } // Internal recursive comparison function for `isEqual`.


    function deepEq(a, b, aStack, bStack) {
      // Unwrap any wrapped objects.
      a = unwrap(a);
      b = unwrap(b); // Compare `[[Class]]` names.

      var className = toString.call(a);
      if (className !== toString.call(b)) return false;

      switch (className) {
        // Strings, numbers, regular expressions, dates, and booleans are compared by value.
        case "[object RegExp]": // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')

        case "[object String]":
          // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
          // equivalent to `new String("5")`.
          return "" + a === "" + b;

        case "[object Number]":
          // `NaN`s are equivalent, but non-reflexive.
          // Object(NaN) is equivalent to NaN.
          if (+a !== +a) return +b !== +b; // An `egal` comparison is performed for other numeric values.

          return +a === 0 ? 1 / +a === 1 / b : +a === +b;

        case "[object Date]":
        case "[object Boolean]":
          // Coerce dates and booleans to numeric primitive values. Dates are compared by their
          // millisecond representations. Note that invalid dates with millisecond representations
          // of `NaN` are not equivalent.
          return +a === +b;

        case "[object Symbol]":
          return typeof Symbol !== "undefined" && Symbol.valueOf.call(a) === Symbol.valueOf.call(b);
      }

      var areArrays = className === "[object Array]";

      if (!areArrays) {
        if (typeof a != "object" || typeof b != "object") return false; // Objects with different constructors are not equivalent, but `Object`s or `Array`s
        // from different frames are.

        var aCtor = a.constructor,
            bCtor = b.constructor;

        if (aCtor !== bCtor && !(typeof aCtor === "function" && aCtor instanceof aCtor && typeof bCtor === "function" && bCtor instanceof bCtor) && "constructor" in a && "constructor" in b) {
          return false;
        }
      } // Assume equality for cyclic structures. The algorithm for detecting cyclic
      // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
      // Initializing stack of traversed objects.
      // It's done here since we only need them for objects and arrays comparison.


      aStack = aStack || [];
      bStack = bStack || [];
      var length = aStack.length;

      while (length--) {
        // Linear search. Performance is inversely proportional to the number of
        // unique nested structures.
        if (aStack[length] === a) return bStack[length] === b;
      } // Add the first object to the stack of traversed objects.


      aStack.push(a);
      bStack.push(b); // Recursively compare objects and arrays.

      if (areArrays) {
        // Compare array lengths to determine if a deep comparison is necessary.
        length = a.length;
        if (length !== b.length) return false; // Deep compare the contents, ignoring non-numeric properties.

        while (length--) {
          if (!eq(a[length], b[length], aStack, bStack)) return false;
        }
      } else {
        // Deep compare objects.
        var keys$$1 = Object.keys(a);
        var key = void 0;
        length = keys$$1.length; // Ensure that both objects contain the same number of properties before comparing deep equality.

        if (Object.keys(b).length !== length) return false;

        while (length--) {
          // Deep compare each member
          key = keys$$1[length];
          if (!(has$1(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
        }
      } // Remove the first object from the stack of traversed objects.


      aStack.pop();
      bStack.pop();
      return true;
    }

    function unwrap(a) {
      if (isObservableArray$$1(a)) return a.slice();
      if (isES6Map$$1(a) || isObservableMap$$1(a)) return Array.from(a.entries());
      if (isES6Set$$1(a) || isObservableSet$$1(a)) return Array.from(a.entries());
      return a;
    }

    function has$1(a, key) {
      return Object.prototype.hasOwnProperty.call(a, key);
    }

    function makeIterable(iterator) {
      iterator[Symbol.iterator] = self;
      return iterator;
    }

    function self() {
      return this;
    }
    /*
    The only reason for this file to exist is pure horror:
    Without it rollup can make the bundling fail at any point in time; when it rolls up the files in the wrong order
    it will cause undefined errors (for example because super classes or local variables not being hosted).
    With this file that will still happen,
    but at least in this file we can magically reorder the imports with trial and error until the build succeeds again.
    */

    /**
     * (c) Michel Weststrate 2015 - 2018
     * MIT Licensed
     *
     * Welcome to the mobx sources! To get an global overview of how MobX internally works,
     * this is a good place to start:
     * https://medium.com/@mweststrate/becoming-fully-reactive-an-in-depth-explanation-of-mobservable-55995262a254#.xvbh6qd74
     *
     * Source folders:
     * ===============
     *
     * - api/     Most of the public static methods exposed by the module can be found here.
     * - core/    Implementation of the MobX algorithm; atoms, derivations, reactions, dependency trees, optimizations. Cool stuff can be found here.
     * - types/   All the magic that is need to have observable objects, arrays and values is in this folder. Including the modifiers like `asFlat`.
     * - utils/   Utility stuff.
     *
     */


    if (typeof Proxy === "undefined" || typeof Symbol === "undefined") {
      throw new Error("[mobx] MobX 5+ requires Proxy and Symbol objects. If your environment doesn't support Symbol or Proxy objects, please downgrade to MobX 4. For React Native Android, consider upgrading JSCore.");
    }

    try {
      // define process.env if needed
      // if this is not a production build in the first place
      // (in which case the expression below would be substituted with 'production')
      process.env.NODE_ENV;
    } catch (e) {
      var g = typeof window !== "undefined" ? window : global;
      if (typeof process === "undefined") g.process = {};
      g.process.env = {};
    }

    (function () {
      function testCodeMinification() {}

      if (testCodeMinification.name !== "testCodeMinification" && process.env.NODE_ENV !== "production" && process.env.IGNORE_MOBX_MINIFY_WARNING !== "true") {
        console.warn( // Template literal(backtick) is used for fix issue with rollup-plugin-commonjs https://github.com/rollup/rollup-plugin-commonjs/issues/344
        "[mobx] you are running a minified build, but 'process.env.NODE_ENV' was not set to 'production' in your bundler. This results in an unnecessarily large and slow bundle");
      }
    })(); // Devtools support


    if (typeof __MOBX_DEVTOOLS_GLOBAL_HOOK__ === "object") {
      // See: https://github.com/andykog/mobx-devtools/
      __MOBX_DEVTOOLS_GLOBAL_HOOK__.injectMobx({
        spy: spy$$1,
        extras: {
          getDebugName: getDebugName$$1
        },
        $mobx: $mobx$$1
      });
    }

    function _taggedTemplateLiteral(strings, raw) {
      if (!raw) {
        raw = strings.slice(0);
      }

      return Object.freeze(Object.defineProperties(strings, {
        raw: {
          value: Object.freeze(raw)
        }
      }));
    }

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    // unsafeHTML directive, and the DocumentFragment that was last set as a value.
    // The DocumentFragment is used as a unique key to check if the last value
    // rendered to the part was with unsafeHTML. If not, we'll always re-render the
    // value passed to unsafeHTML.

    const previousValues = new WeakMap();
    /**
     * Renders the result as HTML, rather than text.
     *
     * Note, this is unsafe to use with any user-provided input that hasn't been
     * sanitized or escaped, as it may lead to cross-site-scripting
     * vulnerabilities.
     */

    const unsafeHTML = directive(value => part => {
      if (!(part instanceof NodePart)) {
        throw new Error('unsafeHTML can only be used in text bindings');
      }

      const previousValue = previousValues.get(part);

      if (previousValue !== undefined && isPrimitive(value) && value === previousValue.value && part.value === previousValue.fragment) {
        return;
      }

      const template = document.createElement('template');
      template.innerHTML = value; // innerHTML casts to string internally

      const fragment = document.importNode(template.content, true);
      part.setValue(fragment);
      previousValues.set(part, {
        value,
        fragment
      });
    });

    function _templateObject2() {
      const data = _taggedTemplateLiteral(["\n                <li>", "</li>\n              "]);

      _templateObject2 = function _templateObject2() {
        return data;
      };

      return data;
    }

    function _templateObject() {
      const data = _taggedTemplateLiteral(["\n    <header>\n      <progress value=", " max=", "\n        >", "\n      </progress>\n      <div>", "</div>\n    </header>\n    <main>\n      <details ?open=", ">\n        <summary\n          @click=", "\n          ><div>", "</div></summary\n        >\n        <div class=\"answers\">\n          <ul>\n            ", "\n          </ul>\n        </div>\n      </details>\n    </main>\n    <footer>\n      <fieldset>\n        <div>\n          <button\n            type=\"button\"\n            @click=", "\n            class=\"button button--incorrect\"\n          >\n            Incorrect\n          </button>\n          <button\n            type=\"button\"\n            @click=", "\n            class=\"button button--correct\"\n          >\n            Correct\n          </button>\n        </div>\n      </fieldset>\n    </footer>\n    <div hidden>\n      <p>correct: ", "</p>\n      <p>incorrect: ", "</p>\n      <p>index: ", "</p>\n      <p>pass: ", "</p>\n      <p>open: ", "</p>\n    </div>\n  "]);

      _templateObject = function _templateObject() {
        return data;
      };

      return data;
    }

    const Question = store => {
      const current = store.currentQuestion;
      return html(_templateObject(), store.correct.length, store.questions.length, store.percentCorrect, store.percentCorrect, store.open, e => {
        e.preventDefault();
        store.toggleOpen();
      }, unsafeHTML(current.question), current.answers.map(answer => {
        return html(_templateObject2(), answer);
      }), () => store.markAsIncorrect(current), () => store.markAsCorrect(current), store.correct.length, store.incorrect.length, current.id, store.pass, store.open);
    };

    function _templateObject3() {
      const data = _taggedTemplateLiteral(["\n                    <dd>", "</dd>\n                  "]);

      _templateObject3 = function _templateObject3() {
        return data;
      };

      return data;
    }

    function _templateObject2$1() {
      const data = _taggedTemplateLiteral(["\n            <dd>\n              <dl>\n                <dt>", "</dt>\n                ", "\n              </dl>\n            </dd>\n          "]);

      _templateObject2$1 = function _templateObject2() {
        return data;
      };

      return data;
    }

    function _templateObject$1() {
      const data = _taggedTemplateLiteral(["\n    <div>\n      <h1>Complete!</h1>\n      <dl>\n        <dt>Questions missed:</dt>\n        <dd>", " of ", "</dd>\n        <dd>", " correct</dd>\n        <dt>Questions most missed:</dt>\n        ", "\n      </dl>\n      <button @click=", ">Retake the test</button>\n    </div>\n  "]);

      _templateObject$1 = function _templateObject() {
        return data;
      };

      return data;
    }

    const Complete = store => {
      return html(_templateObject$1(), store.incorrect.length, store.questions.length, store.percentCorrect, store.mostDifficultQuestions.map(item => {
        return html(_templateObject2$1(), item.question, item.answers.map(answer => {
          return html(_templateObject3(), answer);
        }));
      }), () => store.reset());
    };

    var data = [{
      id: 1,
      question: "What is the supreme law of the land?",
      answers: ["the Constitution"]
    }, {
      id: 2,
      question: "What does the Constitution do?",
      answers: ["sets up the government", "defines the government", "protects basic rights of Americans"]
    }, {
      id: 3,
      question: "The idea of self-government is in the first three words of the Constitution. What are these words?",
      answers: ["We the People"]
    }, // {
    //   id: 4,
    //   question: "What is an amendment?",
    //   answers: [
    //     "a change (to the Constitution)",
    //     "an addition (to the Constitution)"
    //   ]
    // },
    // {
    //   id: 5,
    //   question: "What do we call the first ten amendments to the Constitution?",
    //   answers: ["the Bill of Rights"]
    // },
    {
      id: 6,
      question: "What is <b>one</b> right or freedom from the First Amendment?",
      answers: ["speech", "religion", "assembly", "press", "petition the government"] // {
      //   id: 7,
      //   question: "How many amendments does the Constitution have?",
      //   answers: ["27"]
      // },
      // {
      //   id: 8,
      //   question: "What did the Declaration of Independence do?",
      //   answers: [
      //     "announced our independence (from Great Britain)",
      //     "declared our independence (from Great Britain)",
      //     "said that the United States is free (from Great Britain)"
      //   ]
      // },
      // {
      //   id: 9,
      //   question: "What are <b>two</b> rights in the Declaration of Independence?",
      //   answers: ["life", "liberty", "pursuit of happiness"]
      // },
      // {
      //   id: 10,
      //   question: "What is freedom of religion?",
      //   answers: ["You can practice any religion, or not practice a religion."]
      // },
      // {
      //   id: 11,
      //   question: "What is the economic system in the United States?",
      //   answers: ["capitalist economy", "market economy"]
      // },
      // {
      //   id: 12,
      //   question: "What is the “rule of law”?",
      //   answers: [
      //     "Everyone must follow the law.",
      //     "Leaders must obey the law.",
      //     "Government must obey the law.",
      //     "No one is above the law."
      //   ]
      // },
      // {
      //   id: 13,
      //   question: "Name <b>one</b> branch or part of the government.",
      //   answers: [
      //     "Congress",
      //     "legislative",
      //     "President",
      //     "executive",
      //     "the courts",
      //     "judicial"
      //   ]
      // },
      // {
      //   id: 14,
      //   question: "What stops one branch of government from becoming too powerful?",
      //   answers: ["checks and balances", "separation of powers"]
      // },
      // {
      //   id: 15,
      //   question: "Who is in charge of the executive branch?",
      //   answers: ["the President"]
      // },
      // {
      //   id: 16,
      //   question: "Who makes federal laws?",
      //   answers: [
      //     "Congress",
      //     "Senate and House (of Representatives)",
      //     "(U.S. or national) legislature"
      //   ]
      // },
      // {
      //   id: 17,
      //   question: "What are the two parts of the U.S. Congress?",
      //   answers: ["the Senate and House (of Representatives)"]
      // },
      // {
      //   id: 18,
      //   question: "How many U.S. Senators are there? ",
      //   answers: ["100"]
      // },
      // {
      //   id: 19,
      //   question: "We elect a U.S. Senator for how many years?",
      //   answers: ["6"]
      // },
      // {
      //   id: 20,
      //   question: "Who is one of your state’s U.S. Senators now?",
      //   answers: ["Ted Cruz", "John Cornyn"]
      // },
      // {
      //   id: 21,
      //   question: "The House of Representatives has how many voting members?",
      //   answers: ["435"]
      // },
      // {
      //   id: 22,
      //   question: "We elect a U.S. Representative for how many years?",
      //   answers: ["2"]
      // },
      // {
      //   id: 23,
      //   question: "Name your U.S. Representative.",
      //   answers: ["John Carter"]
      // },
      // {
      //   id: 24,
      //   question: "Who does a U.S. Senator represent?",
      //   answers: ["All people of the state"]
      // },
      // {
      //   id: 25,
      //   question: "Why do some states have more Representatives than other states?",
      //   answers: ["Because of the state’s population"]
      // },
      // {
      //   id: 26,
      //   question: "We elect a President for how many years?",
      //   answers: ["4"]
      // },
      // {
      //   id: 27,
      //   question: "In what month do we vote for President?",
      //   answers: ["November"]
      // },
      // {
      //   id: 28,
      //   question: "What is the name of the President of the United States now?",
      //   answers: ["Donald Trump"]
      // },
      // {
      //   id: 29,
      //   question:
      //     "What is the name of the Vice President of the United States now?",
      //   answers: ["Mike Pence"]
      // },
      // {
      //   id: 30,
      //   question: "If the President can no longer serve, who becomes President?",
      //   answers: ["the Vice President"]
      // },
      // {
      //   id: 31,
      //   question:
      //     "If both the President and the Vice President can no longer serve, who becomes President?",
      //   answers: ["the Speaker of the House"]
      // },
      // {
      //   id: 32,
      //   question: "Who is the Commander in Chief of the military?",
      //   answers: ["the President"]
      // },
      // {
      //   id: 33,
      //   question: "Who signs bills to become laws?",
      //   answers: ["the President"]
      // },
      // {
      //   id: 34,
      //   question: "Who vetoes bills?",
      //   answers: ["the President"]
      // },
      // {
      //   id: 35,
      //   question: "What does the President’s Cabinet do?",
      //   answers: ["advises the President"]
      // },
      // {
      //   id: 36,
      //   question: "What are <b>two</b> Cabinet-level positions?",
      //   answers: [
      //     "Secretary of Agriculture",
      //     "Secretary of Commerce",
      //     "Secretary of Defense",
      //     "Secretary of Education",
      //     "Secretary of Energy",
      //     "Secretary of Health and Human Services",
      //     "Secretary of Homeland Security",
      //     "Secretary of Housing and Urban Development",
      //     "Secretary of the Interior",
      //     "Secretary of Labor",
      //     "Secretary of State",
      //     "Secretary of Transportation",
      //     "Secretary of the Treasury",
      //     "Secretary of Veterans Affairs",
      //     "Attorney General",
      //     "Vice President"
      //   ]
      // },
      // {
      //   id: 37,
      //   question: "What does the judicial branch do?",
      //   answers: [
      //     "reviews laws",
      //     "explains laws",
      //     "resolves disputes (disagreements)",
      //     "decides if a law goes against the Constitution"
      //   ]
      // },
      // {
      //   id: 38,
      //   question: "What is the highest court in the United States?",
      //   answers: ["the Supreme Court"]
      // },
      // {
      //   id: 39,
      //   question: "How many justices are on the Supreme Court?",
      //   answers: ["9"]
      // },
      // {
      //   id: 40,
      //   question: "Who is the Chief Justice of the United States now?",
      //   answers: ["John Roberts"]
      // },
      // {
      //   id: 41,
      //   question:
      //     "Under our Constitution, some powers belong to the federal government. What is <b>one</b> power of the federal government?",
      //   answers: [
      //     "to print money",
      //     "to declare war",
      //     "to create an army",
      //     "to make treaties"
      //   ]
      // },
      // {
      //   id: 42,
      //   question:
      //     "Under our Constitution, some powers belong to the states. What is <b>one</b> power of the states?",
      //   answers: [
      //     "provide schooling and education",
      //     "provide protection (police)",
      //     "provide safety (fire departments)",
      //     "give a driver’s license",
      //     "approve zoning and land use"
      //   ]
      // },
      // {
      //   id: 43,
      //   question: "Who is the Governor of your state now?",
      //   answers: ["Greg Abbott"]
      // },
      // {
      //   id: 44,
      //   question: "What is the capital of your state?",
      //   answers: ["Austin"]
      // },
      // {
      //   id: 45,
      //   question: "What are the two major political parties in the United States?",
      //   answers: ["Democrats and Republicans"]
      // },
      // {
      //   id: 46,
      //   question: "What is the political party of the President now?",
      //   answers: ["Republican party"]
      // },
      // {
      //   id: 47,
      //   question:
      //     "What is the name of the Speaker of the House of Representatives now?",
      //   answers: ["Nancy Pelosi"]
      // },
      // {
      //   id: 48,
      //   question:
      //     "There are four amendments to the Constitution about who can vote. Describe <b>one</b> of them.",
      //   answers: [
      //     "Citizens eighteen (18) and older (can vote).",
      //     "You don’t have to pay (a poll tax) to vote.",
      //     "Any citizen can vote. (Women and men can vote.)",
      //     "A male citizen of any race (can vote)."
      //   ]
      // },
      // {
      //   id: 49,
      //   question:
      //     "What is <b>one responsibility</b> that is only for United States citizens?",
      //   answers: ["serve on a jury", "vote in a federal election"]
      // },
      // {
      //   id: 50,
      //   question: "Name <b>one right</b> only for United States citizens.",
      //   answers: ["vote in a federal election", "run for federal office"]
      // },
      // {
      //   id: 51,
      //   question:
      //     "What are <b>two</b> rights of everyone living in the United States?",
      //   answers: [
      //     "freedom of expression",
      //     "freedom of speech",
      //     "freedom of assembly",
      //     "freedom to petition the government",
      //     "freedom of religion",
      //     "the right to bear arms"
      //   ]
      // },
      // {
      //   id: 52,
      //   question:
      //     "What do we show loyalty to when we say the Pledge of Allegiance?",
      //   answers: ["the flag", "the United States"]
      // },
      // {
      //   id: 53,
      //   question:
      //     "What is <b>one</b> promise you make when you become a United States citizen?",
      //   answers: [
      //     "give up loyalty to other countries",
      //     "defend the Constitution and laws of the United States",
      //     "obey the laws of the United States",
      //     "serve in the U.S. military (if needed)",
      //     "serve (do important work for) the nation (if needed)",
      //     "be loyal to the United States"
      //   ]
      // },
      // {
      //   id: 54,
      //   question: "How old do citizens have to be to vote for President?",
      //   answers: ["18 or older"]
      // },
      // {
      //   id: 55,
      //   question:
      //     "What are <b>two</b> ways that Americans can participate in their democracy?",
      //   answers: [
      //     "vote",
      //     "join a political party",
      //     "help with a campaign",
      //     "join a civic group",
      //     "join a community group",
      //     "give an elected official your opinion on an issue",
      //     "call Senators and Representatives",
      //     "publicly support or oppose an issue or policy",
      //     "run for office",
      //     "write to a newspaper"
      //   ]
      // },
      // {
      //   id: 56,
      //   question: "When is the last day you can send in federal income tax forms?",
      //   answers: ["April 15"]
      // },
      // {
      //   id: 57,
      //   question:
      //     "When must all men register for the Selective Service? (the military draft)",
      //   answers: ["at age 18", "between 18 and 26"]
      // },
      // {
      //   id: 58,
      //   question: "What is <b>one</b> reason colonists came to America?",
      //   answers: [
      //     "freedom",
      //     "political liberty",
      //     "religious freedom",
      //     "economic opportunity",
      //     "practice their religion",
      //     "escape persecution"
      //   ]
      // },
      // {
      //   id: 59,
      //   question: "Who lived in America before the Europeans arrived?",
      //   answers: ["Native americans", "American indians"]
      // },
      // {
      //   id: 60,
      //   question: "What group of people was taken to America and sold as slaves?",
      //   answers: ["Africans"]
      // },
      // {
      //   id: 61,
      //   question: "Why did the colonists fight the British?",
      //   answers: [
      //     "because of high taxes (taxation without representation)",
      //     "because the British army stayed in their houses (boarding, quartering)",
      //     "because they didn’t have self-government"
      //   ]
      // },
      // {
      //   id: 62,
      //   question: "Who wrote the Declaration of Independence?",
      //   answers: ["(Thomas) Jefferson"]
      // },
      // {
      //   id: 63,
      //   question: "When was the Declaration of Independence adopted?",
      //   answers: ["July 4, 1776"]
      // },
      // {
      //   id: 64,
      //   question: "There were 13 original states. Name <b>three</b>.",
      //   answers: [
      //     "New Hampshire",
      //     "Massachusetts",
      //     "Rhode Island",
      //     "Connecticut",
      //     "New York",
      //     "New Jersey",
      //     "Pennsylvania",
      //     "Delaware",
      //     "Maryland",
      //     "Virginia",
      //     "North Carolina",
      //     "South Carolina",
      //     "Georgia"
      //   ]
      // },
      // {
      //   id: 65,
      //   question: "What happened at the Constitutional Convention?",
      //   answers: [
      //     "The Constitution was written",
      //     "The Founding Fathers wrote the Constitution"
      //   ]
      // },
      // {
      //   id: 66,
      //   question: "When was the Constitution written?",
      //   answers: ["1787"]
      // },
      // {
      //   id: 67,
      //   question:
      //     "The Federalist Papers supported the passage of the U.S. Constitution. Name <b>one</b> of the writers.",
      //   answers: ["James Madison", "Alexander Hamilton", "John Jay", "Publius"]
      // },
      // {
      //   id: 68,
      //   question: "What is <b>one</b> thing Benjamin Franklin is famous for?",
      //   answers: [
      //     "U.S. diplomat",
      //     "oldest member of the Constitutional Convention",
      //     "first Postmaster General of the United States",
      //     "writer of “Poor Richard’s Almanac”",
      //     "started the first free libraries"
      //   ]
      // },
      // {
      //   id: 69,
      //   question: "Who is the “Father of Our Country”?",
      //   answers: ["George Washington"]
      // },
      // {
      //   id: 70,
      //   question: "Who was the first President?",
      //   answers: ["George Washington"]
      // },
      // {
      //   id: 71,
      //   question: "What territory did the United States buy from France in 1803?",
      //   answers: ["the Louisiana Territory"]
      // },
      // {
      //   id: 72,
      //   question: "Name <b>one</b> war fought by the United States in the 1800s. ",
      //   answers: [
      //     "War of 1812",
      //     "Mexican-American War",
      //     "Civil War",
      //     "Spanish-American War"
      //   ]
      // },
      // {
      //   id: 73,
      //   question: "Name the U.S. war between the North and the South.",
      //   answers: ["the Civil War", "the War between the States"]
      // },
      // {
      //   id: 74,
      //   question: "Name <b>one</b> problem that led to the Civil War.",
      //   answers: ["slavery", "economic reasons", "states' rights"]
      // },
      // {
      //   id: 75,
      //   question: "What was <b>one˘ important thing that Abraham Lincoln did?",
      //   answers: [
      //     "freed the slaves (Emancipation Proclamation)",
      //     "saved (or preserved) the Union",
      //     "led the United States during the Civil War"
      //   ]
      // },
      // {
      //   id: 76,
      //   question: "What did the Emancipation Proclamation do?",
      //   answers: [
      //     "freed the slaves",
      //     "freed slaves in the Confederacy",
      //     "freed slaves in the Confederate states",
      //     "freed slaves in most Southern states"
      //   ]
      // },
      // {
      //   id: 77,
      //   question: "What did Susan B. Anthony do?",
      //   answers: ["fought for women’s rights", "fought for civil rights"]
      // },
      // {
      //   id: 78,
      //   question: "Name <b>one˘ war fought by the United States in the 1900s.",
      //   answers: [
      //     "World War I",
      //     "World War II",
      //     "Korean War",
      //     "Vietnam War",
      //     "(Persian) Gulf War"
      //   ]
      // },
      // {
      //   id: 79,
      //   question: "Who was President during World War I?",
      //   answers: ["(Woodrow) Wilson"]
      // },
      // {
      //   id: 80,
      //   question: "Who was President during the Great Depression and World War II?",
      //   answers: ["(Franklin) Roosevelt"]
      // },
      // {
      //   id: 81,
      //   question: "Who did the United States fight in World War II? ",
      //   answers: ["Japan, Germany, and Italy"]
      // },
      // {
      //   id: 82,
      //   question:
      //     "Before he was President, Eisenhower was a general. What war was he in?",
      //   answers: ["World War II"]
      // },
      // {
      //   id: 83,
      //   question:
      //     "During the Cold War, what was the main concern of the United States?",
      //   answers: ["Communism"]
      // },
      // {
      //   id: 84,
      //   question: "What movement tried to end racial discrimination? ",
      //   answers: ["civil rights movement"]
      // },
      // {
      //   id: 85,
      //   question: "What did Martin Luther King, Jr. do?",
      //   answers: [
      //     "fought for civil rights",
      //     "worked for equality for all Americans"
      //   ]
      // },
      // {
      //   id: 86,
      //   question:
      //     "What major event happened on September 11, 2001, in the United States?",
      //   answers: ["Terrorists attacked the United States"]
      // },
      // {
      //   id: 87,
      //   question: "Name <b>one</b> American Indian tribe in the United States",
      //   answers: [
      //     "Cherokee",
      //     "Navajo",
      //     "Sioux",
      //     "Chippewa",
      //     "Choctaw",
      //     "Pueblo",
      //     "Apache",
      //     "Iroquois",
      //     "Creek",
      //     "Blackfeet",
      //     "Seminole",
      //     "Cheyenne",
      //     "Arawak",
      //     "Shawnee",
      //     "Mohegan",
      //     "Huron",
      //     "Oneida",
      //     "Lakota",
      //     "Crow",
      //     "Teton",
      //     "Hopi",
      //     "Inuit"
      //   ]
      // },
      // {
      //   id: 88,
      //   question:
      //     " Name <b>one</b> of the two longest rivers in the United States.",
      //   answers: ["Missouri River", "Misssissippi River"]
      // },
      // {
      //   id: 89,
      //   question: "What ocean is on the West Coast of the United States?",
      //   answers: ["Pacific (Ocean)"]
      // },
      // {
      //   id: 90,
      //   question: "What ocean is on the East Coast of the United States?",
      //   answers: ["Atlantic (Ocean)"]
      // },
      // {
      //   id: 91,
      //   question: "Name <b>one</b> U.S. territory.",
      //   answers: [
      //     "Puerto Rico",
      //     "U.S. Virgin Islands",
      //     "American Samoa",
      //     "Northern Mariana Islands",
      //     "Guam"
      //   ]
      // },
      // {
      //   id: 92,
      //   question: "Name <b>one</b> state that borders Canada.",
      //   answers: [
      //     "Maine",
      //     "New Hampshire",
      //     "Vermont",
      //     "New York",
      //     "Pennsylvania",
      //     "Ohio",
      //     "Michigan",
      //     "Minnesota",
      //     "North Dakota",
      //     "Montana",
      //     "Idaho",
      //     "Washington",
      //     "Alaska"
      //   ]
      // },
      // {
      //   id: 93,
      //   question: "Name <b>one</b> state that borders Mexico. ",
      //   answers: ["California", "Arizona", "New Mexico", "Texas"]
      // },
      // {
      //   id: 94,
      //   question: "What is the capital of the United States?",
      //   answers: ["Washington, D.C."]
      // },
      // {
      //   id: 95,
      //   question: "Where is the Statue of Liberty?",
      //   answers: ["New York (Harbor)", "Liberty Island"]
      // },
      // {
      //   id: 96,
      //   question: "Why does the flag have 13 stripes?",
      //   answers: [
      //     "because there were 13 original colonies",
      //     "because the stripes represent the original colonies"
      //   ]
      // },
      // {
      //   id: 97,
      //   question: "Why does the flag have 50 stars?",
      //   answers: [
      //     "because there is one star for each state",
      //     "because each star represents a state",
      //     "because there are 50 states"
      //   ]
      // },
      // {
      //   id: 98,
      //   question: "What is the name of the national anthem?",
      //   answers: ["The Star-Spangled Banner"]
      // },
      // {
      //   id: 99,
      //   question: "When do we celebrate Independence Day?",
      //   answers: ["July 4"]
      // },
      // {
      //   id: 100,
      //   question: "Name <b>two</b> national U.S. holidays.",
      //   answers: [
      //     "New Year’s Day",
      //     "Martin Luther King, Jr. Day",
      //     "Presidents’ Day",
      //     "Memorial Day",
      //     "Independence Day",
      //     "Labor Day",
      //     "Columbus Day",
      //     "Veterans Day",
      //     "Thanksgiving",
      //     "Christmas"
      //   ]
      // }

    }];

    function randomInRange(min, max) {
      if (!min) min = 0;
      if (!max) max = 100;
      return Math.floor(Math.random() * (max - min)) + min;
    }

    const kv = data.reduce((acc, item) => {
      item.incorrect = 0;
      item.correct = 0;
      item.pass = 0;
      acc.push(item);
      return acc;
    }, []);

    class Store {
      constructor(initState) {
        this.questions = initState.questions;
        this.pass = 0;
        this.open = false;
      }

      markAsCorrect(item) {
        runInAction$$1(() => {
          item.correct = item.correct + 1;
          this.toggleOpen();
          this.nextPass();
        });
      }

      markAsIncorrect(item) {
        runInAction$$1(() => {
          item.incorrect = item.incorrect + 1;
          item.pass = item.pass + 1;
          this.toggleOpen();
          this.nextPass();
        });
      }

      nextPass() {
        if (this.toBeAnswered.length === 0 && this.incorrect.length > 0) {
          this.pass = this.pass + 1;
        }
      }

      toggleOpen() {
        runInAction$$1(() => {
          this.open = !this.open;
        });
      }

      reset() {
        runInAction$$1(() => {
          this.questions.forEach(q => {
            q.pass = 0;
            q.correct = 0;
            q.incorrect = 0;
          });
          this.pass = 0;
        });
      }

      get toBeAnswered() {
        return this.questions.filter(item => {
          return item.correct === 0 && item.pass <= this.pass;
        });
      }

      get currentQuestion() {
        const newIdx = randomInRange(0, this.toBeAnswered.length);
        return this.toBeAnswered[newIdx];
      }

      get correct() {
        return this.questions.filter(item => item.correct);
      }

      get incorrect() {
        return this.questions.filter(item => item.incorrect);
      } // Questions which were *never* answered incorrectly.


      get notIncorrect() {
        return this.questions.filter(item => item.correct && !item.incorrect);
      }

      get mostDifficultQuestions() {
        return this.questions.filter(item => {
          return item.incorrect && item.pass === this.pass - 1;
        });
      }

      get percentCorrect() {
        return "".concat(Math.floor(this.notIncorrect.length / this.questions.length * 100), "%");
      }

    }

    decorate$$1(Store, {
      questions: observable$$1,
      pass: observable$$1,
      open: observable$$1,
      toBeAnswered: computed$$1,
      currentQuestion: computed$$1,
      correct: computed$$1,
      incorrect: computed$$1,
      notIncorrect: computed$$1,
      mostDifficultQuestions: computed$$1,
      percentCorrect: computed$$1
    });
    const store = window.store = new Store({
      questions: kv
    });

    function styleInject(css, ref) {
      if (ref === void 0) ref = {};
      var insertAt = ref.insertAt;

      if (!css || typeof document === 'undefined') {
        return;
      }

      var head = document.head || document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      style.type = 'text/css';

      if (insertAt === 'top') {
        if (head.firstChild) {
          head.insertBefore(style, head.firstChild);
        } else {
          head.appendChild(style);
        }
      } else {
        head.appendChild(style);
      }

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
    }

    var css = "body {\n  font-family: sans-serif; }\n\n*, *:before, *:after {\n  box-sizing: border-box; }\n\nbody, #app {\n  display: flex;\n  flex-direction: column;\n  flex-grow: 1;\n  margin: 0; }\n\n#app > * {\n  padding: 0.5rem 1rem;\n  border-top: 1px solid gray; }\n  #app > *:first-child {\n    padding-top: 1rem;\n    border-top: none; }\n  #app > *:last-child {\n    padding-bottom: 1rem; }\n\nheader {\n  background: #003366;\n  display: flex;\n  flex-direction: column;\n  text-align: center;\n  color: #fff;\n  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25) inset; }\n\nmain {\n  flex: 1 1;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  background: repeating-linear-gradient(45deg, #f5f5f5, #f5f5f5 10px, #fff 10px, #fff 20px); }\n\nfooter {\n  background: #e8e8e8; }\n\ndetails {\n  transform: perspective(0);\n  display: flex;\n  flex-direction: column; }\n  details summary {\n    text-align: center;\n    font-size: 3rem;\n    transition: font-size 0.2s;\n    outline: none;\n    flex: 1 1;\n    display: flex;\n    flex-direction: column;\n    align-items: center; }\n    details summary > div {\n      padding: 0.5rem;\n      background: #fff;\n      box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 1px 5px 0 rgba(0, 0, 0, 0.12); }\n  details summary::-webkit-details-marker {\n    display: none; }\n  details .answers {\n    display: flex;\n    justify-content: center;\n    opacity: 0;\n    font-size: 1rem;\n    transition: all 2.2s; }\n    details .answers ul {\n      display: inline-block;\n      margin-bottom: 0; }\n  details:not([open]) summary:after {\n    content: \"Show answers\";\n    background: #003366;\n    color: #fff;\n    border: 1px solid;\n    display: inline-block;\n    font-size: 1rem;\n    padding: 1rem 2rem;\n    margin-top: 1rem;\n    cursor: pointer; }\n    details:not([open]) summary:after:hover {\n      background: #004c99; }\n  details[open] summary {\n    font-size: 1rem; }\n  details[open] .answers {\n    opacity: 1;\n    font-size: 2rem; }\n\n.button {\n  border: 1px solid;\n  padding: 1rem 2rem;\n  cursor: pointer;\n  font-size: 1rem;\n  color: #fff; }\n  .button:hover {\n    color: #fff; }\n  .button--incorrect {\n    background: #CC3333; }\n    .button--incorrect:hover {\n      background: #d92626; }\n  .button--correct {\n    background: #457500; }\n    .button--correct:hover {\n      background: #63a800; }\n\nfieldset {\n  display: block;\n  border: none;\n  margin: 0;\n  padding: 0; }\n  fieldset > div {\n    display: flex;\n    justify-content: space-between; }\n\nprogress {\n  width: 100%;\n  border: 1px solid #fff;\n  margin-bottom: 0.5rem; }\n\nprogress[value]::-webkit-progress-bar {\n  background-color: #eee;\n  border-radius: 2px;\n  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25) inset; }\n\nprogress[value]::-webkit-progress-value::before {\n  content: '80%';\n  position: absolute;\n  right: 0;\n  top: -125%; }\n";
    styleInject(css);

    const App = store$$1 => {
      if (store$$1.toBeAnswered.length > 0) {
        return Question(store$$1);
      } else {
        return Complete(store$$1);
      }
    };

    autorun$$1(() => {
      render(App(store), document.getElementById("app"));
    });

}());
