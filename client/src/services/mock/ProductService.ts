export interface Product {
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

export interface ProductOrder {
    id: string;
    productCode: string;
    date: string;
    amount: number;
    quantity: number;
    customer: string;
    status: string;
}

export const ProductService = {
    getProductsData(): Product[] {
        return [
            {
                id: '1000',
                code: 'f230fh0g3',
                name: 'Bamboo Watch',
                description: 'Product Description',
                image: 'bamboo-watch.jpg',
                price: 65,
                category: 'Accessories',
                quantity: 24,
                inventoryStatus: 'INSTOCK',
                rating: 5
            },
            {
                id: '1001',
                code: 'nvklal433',
                name: 'Black Watch',
                description: 'Product Description',
                image: 'black-watch.jpg',
                price: 72,
                category: 'Accessories',
                quantity: 61,
                inventoryStatus: 'INSTOCK',
                rating: 4
            },
            {
                id: '1002',
                code: 'zz21cz3c1',
                name: 'Blue Band',
                description: 'Product Description',
                image: 'blue-band.jpg',
                price: 79,
                category: 'Fitness',
                quantity: 2,
                inventoryStatus: 'LOWSTOCK',
                rating: 3
            },
            // ... more products
        ];
    },

    getProductsMini(): Promise<Product[]> {
        return Promise.resolve(this.getProductsData().slice(0, 5));
    },

    getProductsSmall(): Promise<Product[]> {
        return Promise.resolve(this.getProductsData().slice(0, 10));
    },

    getProducts(): Promise<Product[]> {
        return Promise.resolve(this.getProductsData());
    },

    getProductsWithOrdersSmall(): Promise<(Product & { orders: ProductOrder[] })[]> {
        const orders: ProductOrder[] = [
            {
                id: '1000',
                productCode: 'f230fh0g3',
                date: '2020-09-13',
                amount: 65,
                quantity: 1,
                customer: 'David James',
                status: 'PENDING'
            },
            // ... more orders
        ];
        
        // Map products with their orders
        return Promise.resolve(this.getProductsData().slice(0, 5).map(product => ({
            ...product,
            orders: orders.filter(order => order.productCode === product.code)
        })));
    }
};
