export function getSwaggerSpec() {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Auction App API',
      version: '1.0.0',
      description: 'Backend API para sistema de subastas online',
    },
    servers: [{ url: '/api' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            data: { nullable: true, example: null },
            error: { oneOf: [{ type: 'string' }, { type: 'object' }] },
          },
        },
        Success: {
          type: 'object',
          properties: {
            data: {},
            error: { nullable: true, example: null },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth' },
      { name: 'Profile' },
      { name: 'PaymentMethods' },
      { name: 'Auctions' },
      { name: 'Catalog' },
      { name: 'Bids' },
      { name: 'Purchases' },
      { name: 'Consignments' },
      { name: 'Notifications' },
      { name: 'History' },
      { name: 'Admin' },
    ],
    paths: {
      '/auth/register/step1': {
        post: {
          tags: ['Auth'],
          summary: 'Registro paso 1 — datos personales',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'nombre', 'apellido', 'domicilio', 'numeroPais'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    nombre: { type: 'string' },
                    apellido: { type: 'string' },
                    domicilio: { type: 'string' },
                    numeroPais: { type: 'integer', description: 'Número de país (FK a tabla paises)' },
                    fotoDocFrenteUrl: { type: 'string', format: 'uri' },
                    fotoDocDorsoUrl: { type: 'string', format: 'uri' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Usuario creado, pendiente verificación' },
            422: { description: 'Validation error' },
          },
        },
      },
      '/auth/register/status': {
        get: {
          tags: ['Auth'],
          summary: 'Estado de verificación del registro',
          responses: {
            200: { description: 'Estado actual del usuario' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/auth/register/complete': {
        post: {
          tags: ['Auth'],
          summary: 'Completar registro — establecer contraseña',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['userId', 'password'],
                  properties: {
                    userId: { type: 'string', format: 'uuid' },
                    password: { type: 'string', minLength: 8 },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Contraseña establecida' },
            403: { description: 'Account not approved' },
            422: { description: 'Validation error' },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Iniciar sesión',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login exitoso, retorna accessToken' },
            401: { description: 'Credenciales inválidas' },
          },
        },
      },
      '/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Cerrar sesión',
          responses: { 200: { description: 'Sesión cerrada' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/auth/password/forgot': {
        post: {
          tags: ['Auth'],
          summary: 'Solicitar reset de contraseña',
          security: [],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } },
          },
          responses: { 200: { description: 'Email enviado si existe' } },
        },
      },
      '/auth/password/reset': {
        post: {
          tags: ['Auth'],
          summary: 'Resetear contraseña (con token válido)',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['password'], properties: { password: { type: 'string', minLength: 8 } } } } },
          },
          responses: { 200: { description: 'Contraseña actualizada' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/users/me': {
        get: {
          tags: ['Profile'],
          summary: 'Obtener perfil del usuario',
          responses: { 200: { description: 'Datos del perfil' }, 401: { description: 'Unauthorized' } },
        },
        put: {
          tags: ['Profile'],
          summary: 'Actualizar domicilio y país',
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { domicilio: { type: 'string' }, numeroPais: { type: 'integer', description: 'Número de país (FK a tabla paises)' } } } } },
          },
          responses: { 200: { description: 'Perfil actualizado' }, 422: { description: 'Validation error' } },
        },
        delete: {
          tags: ['Profile'],
          summary: 'Solicitar baja de cuenta',
          responses: { 200: { description: 'Cuenta desactivada' }, 400: { description: 'Tiene compras pendientes' } },
        },
      },
      '/users/me/password': {
        put: {
          tags: ['Profile'],
          summary: 'Cambiar contraseña',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['newPassword'], properties: { newPassword: { type: 'string', minLength: 8 } } } } },
          },
          responses: { 200: { description: 'Contraseña actualizada' } },
        },
      },
      '/users/me/payment-methods': {
        get: {
          tags: ['PaymentMethods'],
          summary: 'Listar medios de pago del usuario',
          responses: { 200: { description: 'Lista de medios de pago' } },
        },
      },
      '/users/me/payment-methods/bank-account': {
        post: {
          tags: ['PaymentMethods'],
          summary: 'Registrar cuenta bancaria',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['banco', 'numeroCuenta', 'titular', 'numeroPaisId', 'moneda'],
                  properties: {
                    banco: { type: 'string' }, numeroCuenta: { type: 'string' },
                    titular: { type: 'string' }, numeroPaisId: { type: 'integer', description: 'Número de país (FK a tabla paises)' },
                    moneda: { type: 'string' }, swiftBic: { type: 'string' }, iban: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Cuenta registrada' }, 422: { description: 'Validation error' } },
        },
      },
      '/users/me/payment-methods/credit-card': {
        post: {
          tags: ['PaymentMethods'],
          summary: 'Registrar tarjeta de crédito',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['ultimosCuatro', 'marca', 'titular', 'mesVencimiento', 'anioVencimiento'],
                  properties: {
                    ultimosCuatro: { type: 'string', length: 4 }, marca: { type: 'string' },
                    titular: { type: 'string' }, mesVencimiento: { type: 'integer', minimum: 1, maximum: 12 },
                    anioVencimiento: { type: 'integer' }, esInternacional: { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Tarjeta registrada' } },
        },
      },
      '/users/me/payment-methods/certified-check': {
        post: {
          tags: ['PaymentMethods'],
          summary: 'Registrar cheque certificado',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['banco', 'numeroCheque', 'monto', 'fechaVencimiento'],
                  properties: {
                    banco: { type: 'string' }, numeroCheque: { type: 'string' },
                    monto: { type: 'number' }, fechaVencimiento: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Cheque registrado' } },
        },
      },
      '/users/me/payment-methods/{id}': {
        get: {
          tags: ['PaymentMethods'],
          summary: 'Detalle de un medio de pago',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Detalle' }, 404: { description: 'Not found' } },
        },
        delete: {
          tags: ['PaymentMethods'],
          summary: 'Eliminar medio de pago',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Eliminado' }, 400: { description: 'No se puede eliminar' }, 404: { description: 'Not found' } },
        },
      },
      '/users/me/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'Listar notificaciones del usuario',
          responses: { 200: { description: 'Lista de notificaciones' } },
        },
      },
      '/users/me/notifications/{id}/read': {
        patch: {
          tags: ['Notifications'],
          summary: 'Marcar notificación como leída',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Notificación marcada como leída' }, 404: { description: 'Not found' } },
        },
      },
      '/users/me/penalties': {
        get: {
          tags: ['Profile'],
          summary: 'Listar multas del usuario',
          responses: { 200: { description: 'Lista de multas' } },
        },
      },
      '/users/me/penalties/{id}/pay': {
        post: {
          tags: ['Profile'],
          summary: 'Pagar una multa',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Multa pagada' }, 400: { description: 'No está pendiente' }, 404: { description: 'Not found' } },
        },
      },
      '/users/me/participations': {
        get: {
          tags: ['History'],
          summary: 'Historial de participaciones en subastas',
          parameters: [
            { name: 'fechaDesde', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'fechaHasta', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'categoria', in: 'query', schema: { type: 'string', enum: ['comun', 'especial', 'plata', 'oro', 'platino'] } },
            { name: 'resultado', in: 'query', schema: { type: 'string', enum: ['gano', 'perdio', 'participo'] } },
          ],
          responses: { 200: { description: 'Historial con resumen' } },
        },
      },
      '/users/me/participations/{auctionId}': {
        get: {
          tags: ['History'],
          summary: 'Detalle de participación en una subasta',
          parameters: [{ name: 'auctionId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Detalle cronológico' } },
        },
      },
      '/users/me/metrics': {
        get: {
          tags: ['History'],
          summary: 'Métricas personales del usuario',
          responses: { 200: { description: 'Métricas de actividad' } },
        },
      },
      '/auctions': {
        get: {
          tags: ['Auctions'],
          summary: 'Listar subastas (público sin precio base, auth con precio base)',
          security: [],
          parameters: [
            { name: 'estado', in: 'query', schema: { type: 'string', enum: ['programada', 'activa', 'finalizada', 'cancelada'] } },
            { name: 'categoria', in: 'query', schema: { type: 'string', enum: ['comun', 'especial', 'plata', 'oro', 'platino'] } },
            { name: 'moneda', in: 'query', schema: { type: 'string', enum: ['pesos', 'dolares'] } },
            { name: 'fechaDesde', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'fechaHasta', in: 'query', schema: { type: 'string', format: 'date-time' } },
          ],
          responses: { 200: { description: 'Lista de subastas' } },
        },
      },
      '/auctions/{id}': {
        get: {
          tags: ['Auctions'],
          summary: 'Detalle de una subasta',
          security: [],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Detalle de la subasta' }, 404: { description: 'Not found' } },
        },
      },
      '/auctions/{id}/catalog': {
        get: {
          tags: ['Catalog'],
          summary: 'Listar ítems del catálogo',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'estado', in: 'query', schema: { type: 'string' } },
            { name: 'esObraArte', in: 'query', schema: { type: 'boolean' } },
          ],
          responses: { 200: { description: 'Lista de ítems' } },
        },
      },
      '/auctions/{id}/catalog/{itemId}': {
        get: {
          tags: ['Catalog'],
          summary: 'Detalle completo de una pieza',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'itemId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Detalle del ítem' }, 404: { description: 'Not found' } },
        },
      },
      '/auctions/{id}/catalog/{itemId}/bids': {
        get: {
          tags: ['Bids'],
          summary: 'Historial de pujas de un ítem',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'itemId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Lista de pujas ordenadas' } },
        },
      },
      '/auctions/{id}/join': {
        post: {
          tags: ['Auctions'],
          summary: 'Ingresar a la sala de subasta',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            201: { description: 'Sesión creada, retorna ítem actual y mayor oferta' },
            403: { description: 'Sin categoría suficiente, multas pendientes o cuenta no aprobada' },
            409: { description: 'Ya tiene sesión activa' },
          },
        },
      },
      '/auctions/{id}/leave': {
        post: {
          tags: ['Auctions'],
          summary: 'Abandonar la sala de subasta',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Sesión cerrada' }, 404: { description: 'No hay sesión activa' } },
        },
      },
      '/auctions/{id}/bids': {
        post: {
          tags: ['Bids'],
          summary: 'Realizar una puja',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['itemId', 'paymentMethodId', 'monto'],
                  properties: {
                    itemId: { type: 'string', format: 'uuid' },
                    paymentMethodId: { type: 'string', format: 'uuid' },
                    monto: { type: 'number' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Puja creada (estado: enviada)' },
            400: { description: 'Medio de pago inválido' },
            403: { description: 'Sin sesión activa o sin medio verificado' },
            409: { description: 'Ya tiene puja pendiente para este ítem' },
            422: { description: 'Monto fuera de rango' },
          },
        },
      },
      '/auctions/{id}/current-item': {
        get: {
          tags: ['Auctions'],
          summary: 'Ítem actualmente en subasta con mayor oferta',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Ítem actual y mayor puja' }, 404: { description: 'No hay ítem en subasta' } },
        },
      },
      '/purchases/{id}': {
        get: {
          tags: ['Purchases'],
          summary: 'Detalle de una compra',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Detalle de la compra' }, 404: { description: 'Not found' } },
        },
      },
      '/purchases/{id}/pickup': {
        patch: {
          tags: ['Purchases'],
          summary: 'Declarar retiro personal (anula cobertura del seguro)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Retiro declarado, seguro anulado' },
            422: { description: 'La compra debe estar pagada' },
          },
        },
      },
      '/consignments': {
        get: {
          tags: ['Consignments'],
          summary: 'Listar consignaciones propias',
          responses: { 200: { description: 'Lista de consignaciones' } },
        },
        post: {
          tags: ['Consignments'],
          summary: 'Crear solicitud de consignación',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['descripcion'],
                  properties: {
                    descripcion: { type: 'string' }, categoria: { type: 'string' },
                    valorEstimado: { type: 'number' }, esCompuesto: { type: 'boolean' },
                    esObraArte: { type: 'boolean' }, artistaDisenador: { type: 'string' },
                    fechaCreacionObra: { type: 'string', format: 'date-time' }, historia: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Consignación creada' } },
        },
      },
      '/consignments/{id}': {
        get: {
          tags: ['Consignments'],
          summary: 'Detalle de una consignación',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Detalle' }, 404: { description: 'Not found' } },
        },
      },
      '/consignments/{id}/photos': {
        post: {
          tags: ['Consignments'],
          summary: 'Subir fotos del bien (mínimo 6)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['photos'],
                  properties: {
                    photos: { type: 'array', items: { type: 'object', properties: { url: { type: 'string' }, orden: { type: 'integer' } } } },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Fotos cargadas' } },
        },
      },
      '/consignments/{id}/declaration': {
        post: {
          tags: ['Consignments'],
          summary: 'Enviar declaración jurada (finaliza solicitud)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['declaraTitularidad', 'aceptaDevolucionConCargo'],
                  properties: {
                    declaraTitularidad: { type: 'boolean', enum: [true] },
                    aceptaDevolucionConCargo: { type: 'boolean', enum: [true] },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Declaración enviada' }, 422: { description: 'Menos de 6 fotos o checkboxes no marcados' } },
        },
      },
      '/consignments/{id}/inspection-response': {
        post: {
          tags: ['Consignments'],
          summary: 'Aceptar o rechazar condiciones post-inspección',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['userAcepta'], properties: { userAcepta: { type: 'boolean' } } } } },
          },
          responses: { 200: { description: 'Respuesta registrada' }, 400: { description: 'Sin inspección aceptada' }, 409: { description: 'Ya respondió' } },
        },
      },
      '/consignments/{id}/payout-account': {
        post: {
          tags: ['Consignments'],
          summary: 'Declarar cuenta de cobro (antes del inicio de subasta)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['banco', 'numeroCuenta', 'titular', 'numeroPaisId', 'moneda'],
                  properties: {
                    banco: { type: 'string' }, numeroCuenta: { type: 'string' },
                    titular: { type: 'string' }, numeroPaisId: { type: 'integer', description: 'Número de país (FK a tabla paises)' }, moneda: { type: 'string' },
                    swiftBic: { type: 'string' }, iban: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Cuenta declarada' }, 422: { description: 'Subasta ya comenzó' } },
        },
      },
      '/consignments/{id}/insurance': {
        get: {
          tags: ['Consignments'],
          summary: 'Datos de póliza de seguro y contacto de aseguradora',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Info de la póliza' }, 404: { description: 'Not found' } },
        },
      },
      '/consignments/{id}/location': {
        get: {
          tags: ['Consignments'],
          summary: 'Ubicación del bien en depósito',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Depósito y sector' }, 404: { description: 'No está en depósito aún' } },
        },
      },
      '/admin/auctions/{id}/items/{itemId}/adjudicate': {
        post: {
          tags: ['Admin'],
          summary: 'Cerrar puja de un ítem y adjudicar',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'itemId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { comision: { type: 'number' }, costoEnvio: { type: 'number' } },
                },
              },
            },
          },
          responses: { 201: { description: 'Ítem adjudicado, Purchase creado' }, 400: { description: 'Subasta no activa o ítem no en subasta' } },
        },
      },
      '/admin/consignments/{id}/inspect': {
        post: {
          tags: ['Admin'],
          summary: 'Registrar resultado de inspección',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 201: { description: 'Inspección registrada, notificación enviada' }, 404: { description: 'Not found' } },
        },
      },
      '/admin/consignments/{id}/assign-auction': {
        post: {
          tags: ['Admin'],
          summary: 'Asignar bien a una subasta y crear ítem',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['auctionId', 'numeroPieza', 'descripcion', 'precioBase'],
                  properties: {
                    auctionId: { type: 'string' }, numeroPieza: { type: 'string' },
                    descripcion: { type: 'string' }, precioBase: { type: 'number' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Ítem creado y asignado a subasta' } },
        },
      },
      '/admin/payment-methods/{id}/verify': {
        patch: {
          tags: ['Admin'],
          summary: 'Verificar o rechazar un medio de pago',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['estado'],
                  properties: { estado: { type: 'string', enum: ['verificado', 'rechazado'] } },
                },
              },
            },
          },
          responses: { 200: { description: 'Estado actualizado' }, 404: { description: 'Not found' } },
        },
      },
      '/admin/users/{id}/category': {
        patch: {
          tags: ['Admin'],
          summary: 'Asignar categoría y/o estado al usuario',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    categoria: { type: 'string', enum: ['comun', 'especial', 'plata', 'oro', 'platino'] },
                    estado: { type: 'string', enum: ['pendiente_verificacion', 'aprobado', 'multado', 'bloqueado', 'proceso_judicial'] },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Usuario actualizado' }, 404: { description: 'Not found' } },
        },
      },
      '/storage/upload-url': {
        post: {
          tags: ['Storage'],
          summary: 'Obtener URL firmada para subir imagen',
          description: 'Devuelve una `uploadUrl` pre-firmada para hacer PUT directo a Supabase Storage. Usar la `publicUrl` devuelta para referenciar la imagen en otros endpoints.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['filename', 'contentType'],
                  properties: {
                    filename: { type: 'string', example: 'foto.jpg' },
                    contentType: { type: 'string', enum: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] },
                    folder: { type: 'string', enum: ['consignments', 'items', 'docs'], default: 'consignments' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'URL firmada generada',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          uploadUrl: { type: 'string', format: 'uri' },
                          token: { type: 'string' },
                          path: { type: 'string' },
                          publicUrl: { type: 'string', format: 'uri' },
                        },
                      },
                    },
                  },
                },
              },
            },
            422: { description: 'Validation error' },
          },
        },
      },
      '/auctions/{id}/live': {
        get: {
          tags: ['Auctions'],
          summary: 'Canal WebSocket de subasta en vivo',
          description: '**Se implementará con Supabase Realtime en una iteración posterior. No construir ahora.**',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 101: { description: 'WebSocket upgrade (futuro)' } },
        },
      },
    },
  }
}
