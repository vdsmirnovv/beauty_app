import { useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";
import "./App.css";

const API_URL = "https://beauty-back.onrender.com"; 

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

    fetch(`${API_URL}/api/users/by-telegram-id/${telegramId}`)
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
    fetch(`${API_URL}/api/services`)
      .then(res => res.json())
      .then(setServices)
      .catch(err => console.error("Ошибка загрузки услуг:", err));
  };

  const loadBookings = () => {
    fetch(`${API_URL}/api/bookings`)
      .then(res => res.json())
      .then(setBookings)
      .catch(err => console.error("Ошибка загрузки записей:", err));
  };

  const loadSlots = () => {
    fetch(`${API_URL}/api/slots`)
      .then(res => res.json())
      .then(setSlots)
      .catch(err => console.error("Ошибка загрузки слотов:", err));
  };

  const handleCreateService = () => {
    if (!newService.name || !newService.price) return;
    fetch(`${API_URL}/api/services`, {
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
    fetch(`${API_URL}/api/slots`, {
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
    fetch(`${API_URL}/api/bookings`, {
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
    <div className="container">
      <h1 className="section-header">Привет, {user?.fullName}!</h1>

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
    <div className="card">
      <h2 className="section-header">Панель администратора</h2>

      <div className="form-group">
        <h3 className="font-semibold">Добавить услугу</h3>
        <input
          type="text"
          placeholder="Название"
          value={newService.name}
          onChange={e => setNewService({ ...newService, name: e.target.value })}
          className="input"
        />
        <input
          type="number"
          placeholder="Цена"
          value={newService.price}
          onChange={e => setNewService({ ...newService, price: e.target.value })}
          className="input"
        />
        <button onClick={handleCreateService} className="button-primary">Добавить услугу</button>
      </div>

      <div className="form-group">
        <h3 className="font-semibold mt-4">Добавить слот</h3>
        <input
          type="datetime-local"
          value={newSlot.date_time}
          onChange={e => setNewSlot({ ...newSlot, date_time: e.target.value })}
          className="input"
        />
        <select
          value={newSlot.service_id}
          onChange={e => setNewSlot({ ...newSlot, service_id: e.target.value })}
          className="input"
        >
          <option value="">Выбери услугу</option>
          {services.map(service => (
            <option key={service.id} value={service.id}>{service.name}</option>
          ))}
        </select>
        <button onClick={handleCreateSlot} className="button-secondary">Добавить слот</button>
      </div>

      <div>
        <h3 className="font-semibold mt-4">Все слоты:</h3>
        <ul>
          {slots.map(slot => (
            <li key={slot.id}>{new Date(slot.date_time).toLocaleString()} — услуга #{slot.service_id}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function UserInterface({ services, slots, handleBooking, bookings }) {
  return (
    <div className="card">
      <h2 className="section-header">Выбери слот для записи</h2>
      <ul>
        {slots.map(slot => {
          const service = services.find(s => s.id === slot.service_id);
          return (
            <li key={slot.id} className="booking-item">
              <span>{new Date(slot.date_time).toLocaleString()} — {service?.name}</span>
              <button onClick={() => handleBooking(slot.id, service.id)} className="button-book">Записаться</button>
            </li>
          );
        })}
      </ul>

      <h3 className="font-semibold mt-4">Мои записи:</h3>
      <ul>
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
