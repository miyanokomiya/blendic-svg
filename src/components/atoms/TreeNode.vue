<template>
  <div class="tree-node" :class="{ odd: rowIndex % 2 === 0 }">
    <div class="node-view">
      <div :style="{ width: `${nestIndex * 10}px` }" />
      <span class="node-name">{{ node.tag }} #{{ node.id }}</span>
    </div>
    <div class="children-space">
      <TreeNode
        v-for="(c, i) in children"
        :key="c.id"
        :node="c"
        :nest-index="nestIndex + 1"
        :row-index="rowIndex + i + 1"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { ElementNode } from '/@/models'

function shouldHide(tag: string): boolean {
  return /defs|metadata|namedview/.test(tag)
}

export default defineComponent({
  name: 'TreeNode',
  props: {
    node: {
      type: Object as PropType<ElementNode>,
      required: true,
    },
    nestIndex: {
      type: Number,
      default: 0,
    },
    rowIndex: {
      type: Number,
      default: 0,
    },
  },
  setup(props) {
    const children = props.node.children
      .filter((c): c is ElementNode => typeof c !== 'string')
      .filter((elm) => !shouldHide(elm.tag))

    return {
      children,
    }
  },
})
</script>

<style lang="scss" scoped>
.tree-node {
  display: flex;
  flex-direction: column;
  text-align: left;
  font-size: 16px;
  width: fit-content;
  background-color: #fff;
  &.odd {
    background-color: #eee;
  }
}
.node-view {
  padding: 2px;
  display: flex;
  align-items: center;
}
.node-name {
  display: flex;
  align-items: center;
  white-space: nowrap;
  &::before {
    content: ' ';
    margin-right: 4px;
    width: 8px;
    height: 4px;
    border-left: solid 1px #000;
    border-bottom: solid 1px #000;
  }
}
</style>
