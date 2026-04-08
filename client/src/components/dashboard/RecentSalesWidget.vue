<script lang="ts" setup>
  import { ProductService } from '@/services/mock/ProductService';
  import { onMounted, ref } from 'vue';

<<<<<<< HEAD
  interface Product {
    id: string;
    code: string;
    name: string;
    description: string;
    image: string;
    price: number;
    category: string;
    quantity: number;
    inventoryStatus: string;
    rating: number;
  }
=======
interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  image: string;
  price: number;
  category: string;
  quantity: number;
  inventoryStatus: string;
  rating: number;
}
>>>>>>> dev_borrow

  const products = ref<Product[] | null>(null);

<<<<<<< HEAD
  function formatCurrency(value: number) {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  }

  onMounted(() => {
    ProductService.getProductsSmall().then(data => (products.value = data));
  });
=======
function formatCurrency(value: number) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

onMounted(() => {
  ProductService.getProductsSmall().then((data) => (products.value = data));
});
>>>>>>> dev_borrow
</script>

<template>
  <div class="card">
    <div class="font-semibold text-xl mb-4">Recent Sales</div>
<<<<<<< HEAD
    <DataTable
      :value="products"
      :rows="5"
      :paginator="true"
      responsiveLayout="scroll"
    >
=======
    <DataTable :value="products" :rows="5" :paginator="true" responsiveLayout="scroll">
>>>>>>> dev_borrow
      <Column style="width: 15%" header="Image">
        <template #body="slotProps">
          <img
            :src="`https://primefaces.org/cdn/primevue/images/product/${slotProps.data.image}`"
            :alt="slotProps.data.image"
            width="50"
            class="shadow"
          />
        </template>
      </Column>
<<<<<<< HEAD
      <Column
        field="name"
        header="Name"
        :sortable="true"
        style="width: 35%"
      ></Column>
=======
      <Column field="name" header="Name" :sortable="true" style="width: 35%"></Column>
>>>>>>> dev_borrow
      <Column field="price" header="Price" :sortable="true" style="width: 35%">
        <template #body="slotProps">
          {{ formatCurrency(slotProps.data.price) }}
        </template>
      </Column>
      <Column style="width: 15%" header="View">
        <template #body>
<<<<<<< HEAD
          <Button
            icon="pi pi-search"
            type="button"
            class="p-button-text"
          ></Button>
=======
          <Button icon="pi pi-search" type="button" class="p-button-text"></Button>
>>>>>>> dev_borrow
        </template>
      </Column>
    </DataTable>
  </div>
</template>
