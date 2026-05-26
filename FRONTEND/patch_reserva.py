import sys

file_path = "d:\\PROGRAMACION SOFTWARE\\01.PROYECTO HOSPEDAJE DIGITAL\\FRONTEND\\reserva-form.html"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find the start and end indices
start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if '<!-- ══ CENTER FORM ════════════════════════════════════ -->' in line:
        start_idx = i
    if '</aside>' in line and '<!-- ══ RIGHT SIDEBAR ══════════════════════════════════ -->' in ''.join(lines[max(0, i-100):i+1]):
        # Wait, let's find the specific </aside> for the right sidebar.
        pass

for i, line in enumerate(lines):
    if '<div class="rf-center">' in line:
        start_idx = i - 1 # include the comment
        break

for i in range(start_idx + 1, len(lines)):
    if '</aside>' in line and 'rf-btn-ghost' in lines[i-2]:
        end_idx = i
        break

if start_idx == -1 or end_idx == -1:
    print("Could not find start or end index.")
    sys.exit(1)

new_content = """    <!-- ══ CENTER FORM ════════════════════════════════════ -->
    <main class="rf-center bg-gray-50 !p-8">
        <h1 class="text-2xl font-black text-gray-900 mb-8">Nueva Reserva</h1>
        <form id="form-reserva-v2">
            <!-- PASO 1: FECHAS -->
            <section class="mb-10">
                <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span class="w-7 h-7 rounded-full bg-green-800 text-white flex items-center justify-center text-xs">1</span> 
                    Fechas de Estancia
                </h2>
                <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div class="flex justify-between items-center mb-4">
                        <button type="button" id="cal-prev" class="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"><i class="fa-solid fa-chevron-left"></i></button>
                        <span class="text-sm text-gray-500 font-medium">Selecciona entrada y salida</span>
                        <button type="button" id="cal-next" class="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"><i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                    <div id="calendario-wrapper" class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div id="mes-actual"></div>
                        <div id="mes-siguiente"></div>
                    </div>
                </div>
            </section>

            <!-- PASO 2: MODO -->
            <section class="mb-10">
                <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span class="w-7 h-7 rounded-full bg-green-800 text-white flex items-center justify-center text-xs">2</span> 
                    Opciones de Hospedaje
                </h2>
                <div id="modo-toggle" class="flex rounded-xl border border-gray-200 overflow-hidden w-fit mb-6 bg-white shadow-sm">
                    <button type="button" id="btn-habitacion" data-modo="habitacion" class="px-6 py-3 text-sm font-medium flex items-center gap-2 transition-all duration-200 bg-green-800 text-white">
                        <i class="fa-solid fa-bed"></i> Solo Habitación
                    </button>
                    <button type="button" id="btn-paquete" data-modo="paquete" class="px-6 py-3 text-sm font-medium flex items-center gap-2 transition-all duration-200 bg-white text-gray-500 hover:bg-gray-50">
                        <i class="fa-solid fa-box-open"></i> Paquete Completo
                    </button>
                </div>

                <div id="seccion-habitacion">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Selecciona una habitación</label>
                    <select id="select-habitacion" name="habitacion_id" class="w-full max-w-md px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-700 bg-white shadow-sm"></select>
                </div>

                <div id="seccion-paquetes" class="hidden">
                    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4" id="grid-paquetes"></div>
                </div>
            </section>

            <!-- PASO 3: CLIENTE -->
            <section class="mb-10 relative">
                <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span class="w-7 h-7 rounded-full bg-green-800 text-white flex items-center justify-center text-xs">3</span> 
                    Datos del Cliente
                </h2>
                <div class="relative">
                    <i class="fa-solid fa-search absolute left-4 top-3.5 text-gray-400"></i>
                    <input id="buscador-cliente" type="text" autocomplete="off" placeholder="Escribe nombre, apellido o documento..." class="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent transition-all shadow-sm bg-white">
                </div>
                
                <div id="dropdown-clientes" class="hidden absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto"></div>
                <div id="cliente-seleccionado" class="hidden mt-4 flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl shadow-sm"></div>
            </section>

            <!-- PASO 4: SERVICIOS -->
            <section id="seccion-servicios-adicionales" class="mb-10">
                <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span class="w-7 h-7 rounded-full bg-green-800 text-white flex items-center justify-center text-xs">4</span> 
                    Servicios Adicionales
                </h2>
                <div id="servicios-container" class="grid grid-cols-1 md:grid-cols-2 gap-3"></div>
            </section>

            <!-- PASO 5: PAGO -->
            <section class="mb-10">
                <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span class="w-7 h-7 rounded-full bg-green-800 text-white flex items-center justify-center text-xs">5</span> 
                    Pago y Detalles
                </h2>
                <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Método de pago</label>
                        <select id="metodo-pago" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-700 bg-white shadow-sm">
                            <option value="1">Efectivo</option>
                            <option value="2">Tarjeta de credito o debito</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
                        <select id="estado-reserva" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-700 bg-white shadow-sm">
                            <option value="1">Activa</option>
                            <option value="2">Pendiente</option>
                            <option value="3">Cancelada</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Descuento ($)</label>
                        <input type="number" id="descuento" min="0" value="0" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-700 bg-white shadow-sm">
                    </div>
                </div>
            </section>
        </form>
    </main>

    <!-- ══ RIGHT SIDEBAR ══════════════════════════════════ -->
    <aside class="rf-sidebar max-[860px]:hidden !p-6 !bg-white">
        <h3 class="font-black text-gray-900 mb-6 text-xl tracking-tight border-b border-gray-100 pb-4">Resumen</h3>
        
        <div id="resumen-img-wrap" class="hidden mb-5">
            <img id="resumen-img" src="" class="w-full h-32 object-cover rounded-2xl shadow-sm bg-gray-100">
        </div>
        
        <h4 id="resumen-title" class="font-bold text-gray-900 mb-2 text-md">Sin selección</h4>
        <div class="flex items-center gap-2 text-gray-500 mb-6 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <i class="fa-regular fa-calendar text-green-700"></i>
            <p id="resumen-fechas" class="text-xs font-medium">Fechas no seleccionadas</p>
        </div>
        
        <div class="space-y-3 mb-6">
            <div class="flex justify-between items-center text-sm font-medium text-gray-700">
                <span>Habitación/Paquete</span>
                <span id="resumen-habitacion" class="text-gray-900 font-bold">$0</span>
            </div>
            <div class="flex justify-between items-center text-sm font-medium text-gray-700">
                <span>Servicios</span>
                <span id="resumen-servicios" class="text-gray-900 font-bold">$0</span>
            </div>
            <div class="flex justify-between items-center text-sm font-medium text-amber-600">
                <span>Descuento</span>
                <span id="resumen-descuento" class="font-bold">-$0</span>
            </div>
            <div class="pt-3 border-t border-gray-100 border-dashed"></div>
            <div class="flex justify-between items-center text-xs font-medium text-gray-500">
                <span>Subtotal</span>
                <span id="resumen-subtotal">$0</span>
            </div>
            <div class="flex justify-between items-center text-xs font-medium text-gray-500">
                <span>IVA (19%)</span>
                <span id="resumen-iva">$0</span>
            </div>
        </div>

        <div class="bg-green-50 rounded-2xl p-4 border border-green-100 mb-6">
            <div class="flex justify-between items-end">
                <span class="text-sm font-bold text-green-900">TOTAL</span>
                <span id="resumen-total" class="text-xl font-black text-green-800">$0</span>
            </div>
        </div>

        <button type="button" id="btn-confirmar-reserva" class="w-full flex items-center justify-center gap-2 bg-green-800 hover:bg-green-900 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-md">
            <i class="fa-solid fa-check"></i> Confirmar
        </button>
    </aside>
"""

lines = lines[:start_idx] + [new_content + "\n"] + lines[end_idx+1:]

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(lines)

print("Patch successful!")
