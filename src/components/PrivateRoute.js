import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Компонент для захисту маршрутів.
 * @param {Object} props
 * @param {React.ReactNode} props.children - компонент, який потрібно захистити
 * @param {Array<string>} [props.allowedRoles] - масив дозволених ролей (якщо не вказано, достатньо просто авторизації)
 */
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Якщо користувач не авторизований – перенаправляємо на логін, зберігаючи поточний шлях
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  // Якщо вказано дозволені ролі, перевіряємо, чи роль користувача в списку
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Якщо роль не підходить – на головну (або можна на сторінку "Немає доступу")
    return <Navigate to="/" replace />;
  }

  // Якщо все добре – рендеримо дочірній компонент
  return children;
};

export default PrivateRoute;