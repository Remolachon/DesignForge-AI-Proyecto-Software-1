import { createBrowserRouter, Navigate } from 'react-router';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ClienteDashboard from './pages/ClienteDashboard';
import ClientePedidos from './pages/ClientePedidos';
import CrearPedido from './pages/CrearPedido';
import Marketplace from './pages/Marketplace';
import FuncionarioDashboard from './pages/FuncionarioDashboard';
import FuncionarioPedidos from './pages/FuncionarioPedidos';
import FuncionarioCalendario from './pages/FuncionarioCalendario';
import Documentacion from './pages/Documentacion';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/marketplace',
    element: <Marketplace />,
  },
  {
    path: '/documentacion',
    element: <Documentacion />,
  },
  // Cliente routes
  {
    path: '/cliente',
    children: [
      {
        index: true,
        element: <Navigate to="/cliente/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <ClienteDashboard />,
      },
      {
        path: 'crear-pedido',
        element: <CrearPedido />,
      },
      {
        path: 'pedidos',
        element: <ClientePedidos />,
      },
    ],
  },
  // Funcionario routes
  {
    path: '/funcionario',
    children: [
      {
        index: true,
        element: <Navigate to="/funcionario/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <FuncionarioDashboard />,
      },
      {
        path: 'pedidos',
        element: <FuncionarioPedidos />,
      },
      {
        path: 'pedidos/:id',
        element: <FuncionarioPedidos />, // Placeholder
      },
      {
        path: 'calendario',
        element: <FuncionarioCalendario />,
      },
      {
        path: 'marketplace',
        element: <FuncionarioDashboard />, // Placeholder
      },
    ],
  },
  // Admin routes (placeholder)
  {
    path: '/admin',
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <FuncionarioDashboard />, // Placeholder
      },
    ],
  },
  // Catch all
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);