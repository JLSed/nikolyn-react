import NavBar from "../components/NavBar";

function CashierPage() {
  return (
    <main className="flex flex-col gap-2 bg-secondary text-primary font-outfit">
      <NavBar />
      <div className="flex justify-between items-center">
        <p className="font-michroma font-black text-3xl">POINT OF SALES</p>
        <div className="flex gap-2 pr-2">
          <a href="" className="border-2 border-primary px-2 py-1">
            Ongoing
          </a>
          <a href="" className="border-2 border-primary px-2 py-1">
            Completed
          </a>
          <a href="" className="border-2 border-primary px-2 py-1">
            Cancelled
          </a>
        </div>
      </div>
      <main className="flex gap-1">
        <div className="flex-1 flex flex-col gap-1 text-secondary bg-primary min-w-fit pr-4">
          <div className="border-2 border-primary">
            <p className="text-4xl font-bold text-accent">Laundry Weight</p>
            <div className="flex gap-4">
              <div>
                <p>Regular Clothes</p>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    data-category="Regular Clothes"
                    data-limit="7"
                    data-unit="kg"
                    step="0.1"
                    className="category-input p-2 text-primary font-bold bg-secondary"
                  />
                  <p>kg</p>
                </div>
                <p>₱ 55 per 7kg</p>
              </div>
              <div>
                <p>Towels, Blankets, Beddings</p>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    data-category="Towels, Blankets, Beddings"
                    data-limit="4"
                    data-unit="kg"
                    step="0.1"
                    className="category-input p-2 text-primary font-bold bg-secondary"
                  />
                  <p>kg</p>
                </div>
                <p>₱ 55 per 4kg</p>
              </div>
              <div>
                <p>Comforter Queensize, Heavy Blankets</p>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    data-category="Comforter Queensize, Heavy Blankets"
                    data-limit="1"
                    data-unit="pc"
                    step="1"
                    className="category-input p-2 text-primary font-bold bg-secondary"
                  />
                  <p>pc</p>
                </div>
                <p>₱55 per 1pc</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-accent">Services</p>
            <div className="flex">
              <form className="flex gap-4">
                <div className="px-2 flex border-2 border-secondary text-secondary p-1 gap-2">
                  <input
                    className="service-checkbox scale-150"
                    value="Wash"
                    data-price="55"
                    type="checkbox"
                    name=""
                    id=""
                  />
                  <p className="text-2xl">Wash</p>
                </div>
                <div className="px-2 flex border-2 border-secondary text-secondary p-1 gap-2">
                  <input
                    className="service-checkbox scale-150"
                    value="Dry"
                    data-price="55"
                    type="checkbox"
                    name=""
                    id=""
                  />
                  <p className="text-2xl">Dry</p>
                </div>
                <div className="px-2 flex border-2 border-secondary text-secondary p-1 gap-2">
                  <input
                    className="service-checkbox scale-150"
                    value="Fold"
                    data-price="20"
                    type="checkbox"
                    name=""
                    id=""
                  />
                  <p className="text-2xl">Fold</p>
                </div>
                <div className="px-2 flex border-2 border-secondary text-secondary p-1 gap-2">
                  <input
                    className="service-checkbox scale-150"
                    value="Full Service"
                    data-price="100"
                    type="checkbox"
                    name=""
                    id=""
                  />
                  <p className="text-2xl">Full Service</p>
                </div>
              </form>
            </div>
          </div>
          <div className="border-2 border-primary bg-secondary">
            <p className="text-4xl font-bold text-accent">Products</p>
            <div className="flex text-primary">
              <input
                id="search_product"
                className="flex-1 mr-4 p-1 border-2 border-primary text-primary bg-secondary"
                placeholder="Search Product..."
              />
              <p>Filter</p>
            </div>
            <table className="w-full">
              <thead className="text-primary text-left">
                <tr>
                  <th className="p-2">Product Name</th>
                  <th className="p-2">Quantity</th>
                  <th className="p-2">Price</th>
                </tr>
              </thead>
              <tbody
                id="productBody"
                className="bg-primary text-secondary"
              ></tbody>
            </table>
          </div>
        </div>
        <div className=" flex-1 flex flex-col p-2">
          <div id="orderSummary" className=" mb-4 ">
            <p className="font-bold text-3xl">Order</p>
          </div>
          <div className="">
            <p className="font-bold text-3xl">Summary</p>
            <div className="my-2 bg-gray-300 p-4 rounded-lg flex flex-col">
              <div className="flex justify-between">
                <p className="text-2xl">Total </p>
                <p id="orderTotal" className="text-2xl">
                  PHP 0
                </p>
              </div>
            </div>
            <button className="p-3 bg-orange-400 text-xl rounded-lg w-full">
              Complete Payment
            </button>
          </div>
        </div>
      </main>
    </main>
  );
}

export default CashierPage;
