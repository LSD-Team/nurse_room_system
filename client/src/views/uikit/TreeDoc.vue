<script lang="ts" setup>
  import { NodeService } from '@/services/mock/NodeService';
  import { onMounted, ref } from 'vue';
  import type { TreeSelectionKeys } from 'primevue/tree';
  import type { TreeTableSelectionKeys } from 'primevue/treetable';

  const treeValue = ref<any[]>([]);
  const selectedTreeValue = ref<TreeSelectionKeys>({});
  const treeTableValue = ref<any[]>([]);
  const selectedTreeTableValue = ref<TreeTableSelectionKeys>({});

<<<<<<< HEAD
  onMounted(() => {
    treeValue.value = NodeService.getTreeNodesData();
    treeTableValue.value = NodeService.getTreeTableNodesData();
  });
=======
onMounted(() => {
  treeValue.value = NodeService.getTreeNodesData();
  treeTableValue.value = NodeService.getTreeTableNodesData();
});
>>>>>>> dev_borrow
</script>

<template>
  <div class="card">
    <div class="font-semibold text-xl">Tree</div>
    <Tree
      :value="treeValue"
      selectionMode="checkbox"
      v-model:selectionKeys="selectedTreeValue"
    ></Tree>
  </div>

  <div class="card">
    <div class="font-semibold text-xl mb-4">TreeTable</div>
    <TreeTable
      :value="treeTableValue"
      selectionMode="checkbox"
      v-model:selectionKeys="selectedTreeTableValue"
    >
      <Column field="name" header="Name" :expander="true"></Column>
      <Column field="size" header="Size"></Column>
      <Column field="type" header="Type"></Column>
    </TreeTable>
  </div>
</template>
