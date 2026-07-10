export function createCartRepository() {
    return {
        addItem: async (productId: string, quantity: number) => {
            console.log(`Add ${quantity} of ${productId} to local storage`);
            await new Promise(resolve => setTimeout(resolve, 400));
        }
    }
}