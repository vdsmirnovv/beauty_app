
import { useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("user");
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [newService, setNewService] = useState({ name: "", price: "" });
  const [newSlot, setNewSlot] = useState({ date_time: "", service_id: "" });

  useEffect(() => {
    const initData = WebApp.initDataUnsafe;
    const telegramId = initData?.user?.id;
    const fullName = `${initData?.user?.first_name} ${initData?.user?.last_name}`;

    fetch(`http://127.0.0.1:8000/api/users/${telegramId}`)
      .then(res => res.json())
      .then(data => {
        setUser({ ...data, fullName });
        setRole(data.role);
      })
      .catch(err => console.error("Ошибка получения данных о пользователе:", err));

    WebApp.ready();
  }, []);

  useEffect(() => {
    loadServices();
    loadBookings();
    loadSlots();
  }, [role]);

  const loadServices = () => {
    fetch("http://127.0.0.1:8000/api/services")
      .then(res => res.json())
      .then(setServices)
      .catch(err => console.error("Ошибка загрузки услуг:", err));
  };

  const loadBookings = () => {
    fetch("http://127.0.0.1:8000/api/bookings")
      .then(res => res.json())
      .then(setBookings)
      .catch(err => console.error("Ошибка загрузки записей:", err));
  };

  const loadSlots = () => {
    fetch("http://127.0.0.1:8000/api/slots")
      .then(res => res.json())
      .then(setSlots)
      .catch(err => console.error("Ошибка загрузки слотов:", err));
  };

  const handleCreateService = () => {
    if (!newService.name || !newService.price) return;
    fetch("http://127.0.0.1:8000/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newService.name, price: parseFloat(newService.price) })
    })
      .then(() => {
        loadServices();
        setNewService({ name: "", price: "" });
      });
  };

  const handleCreateSlot = () => {
    if (!newSlot.date_time || !newSlot.service_id) return;
    fetch("http://127.0.0.1:8000/api/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date_time: newSlot.date_time,
        service_id: parseInt(newSlot.service_id)
      })
    })
      .then(() => {
        loadSlots();
        setNewSlot({ date_time: "", service_id: "" });
      });
  };

  const handleBooking = (slotId, serviceId) => {
    fetch("http://127.0.0.1:8000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        slot_id: slotId,
        service_id: serviceId
      })
    })
      .then(() => loadBookings())
      .catch(err => console.error("Ошибка записи:", err));
  };

  const userBookings = bookings.filter(b => b.user_id === user?.id);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Привет, {user?.fullName}!</h1>

      {role === "admin" ? (
        <AdminPanel
          services={services}
          bookings={bookings}
          newService={newService}
          setNewService={setNewService}
          handleCreateService={handleCreateService}
          handleCreateSlot={handleCreateSlot}
          newSlot={newSlot}
          setNewSlot={setNewSlot}
          slots={slots}
        />
      ) : (
        <UserInterface
          services={services}
          slots={slots}
          handleBooking={handleBooking}
          bookings={userBookings}
        />
      )}
    </div>
  );
}

function AdminPanel({ services, bookings, newService, setNewService, handleCreateService, handleCreateSlot, newSlot, setNewSlot, slots }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Панель администратора</h2>

      <h3 className="font-semibold">Добавить услугу</h3>
      <input
        type="text"
        placeholder="Название"
        value={newService.name}
        onChange={e => setNewService({ ...newService, name: e.target.value })}
        className="border p-2 rounded mb-2 w-full"
      />
      <input
        type="number"
        placeholder="Цена"
        value={newService.price}
        onChange={e => setNewService({ ...newService, price: e.target.value })}
        className="border p-2 rounded mb-2 w-full"
      />
      <button onClick={handleCreateService} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">
        Добавить услугу
      </button>

      <h3 className="font-semibold mt-4">Добавить слот</h3>
      <input
        type="datetime-local"
        value={newSlot.date_time}
        onChange={e => setNewSlot({ ...newSlot, date_time: e.target.value })}
        className="border p-2 rounded mb-2 w-full"
      />
      <select
        value={newSlot.service_id}
        onChange={e => setNewSlot({ ...newSlot, service_id: e.target.value })}
        className="border p-2 rounded mb-2 w-full"
      >
        <option value="">Выбери услугу</option>
        {services.map(service => (
          <option key={service.id} value={service.id}>{service.name}</option>
        ))}
      </select>
      <button onClick={handleCreateSlot} className="bg-green-500 text-white px-4 py-2 rounded mb-4">
        Добавить слот
      </button>

      <h3 className="font-semibold">Все слоты:</h3>
      <ul className="list-disc pl-5">
        {slots.map(slot => (
          <li key={slot.id}>{new Date(slot.date_time).toLocaleString()} — услуга #{slot.service_id}</li>
        ))}
      </ul>
    </div>
  );
}

function UserInterface({ services, slots, handleBooking, bookings }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Выбери слот для записи</h2>
      <ul className="list-disc pl-5 mb-6">
        {slots.map(slot => {
          const service = services.find(s => s.id === slot.service_id);
          return (
            <li key={slot.id} className="mb-2">
              <span>{new Date(slot.date_time).toLocaleString()} — {service?.name}</span>
              <button onClick={() => handleBooking(slot.id, service.id)} className="ml-2 text-blue-600 underline">
                Записаться
              </button>
            </li>
          );
        })}
      </ul>

      <h3 className="font-semibold mb-2">Мои записи:</h3>
      <ul className="list-disc pl-5">
        {bookings.map(b => {
          const service = services.find(s => s.id === b.service_id);
          const slot = slots.find(s => s.id === b.slot_id);
          return (
            <li key={b.id}>{new Date(slot?.date_time).toLocaleString()} — {service?.name}</li>
          );
        })}
      </ul>
    </div>
  );
}
