import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Materia from './models/Materia.js';
import Asistencia from './models/Asistencia.js';
import Reporte from './models/Reporte.js';
import ReporteLectura from './models/ReporteLectura.js';
import Evaluacion from './models/Evaluacion.js';
import Lineamiento from './models/Lineamiento.js';
import Notificacion from './models/Notificacion.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB conectado para seed...');

    // Limpiar todas las colecciones
    await Promise.all([
      User.deleteMany(),
      Materia.deleteMany(),
      Asistencia.deleteMany(),
      Reporte.deleteMany(),
      ReporteLectura.deleteMany(),
      Evaluacion.deleteMany(),
      Lineamiento.deleteMany(),
      Notificacion.deleteMany()
    ]);
    console.log('Colecciones limpiadas.');

    // ==========================================
    // USUARIOS
    // ==========================================

    // Profesores
    const profesores = await User.create([
      {
        name: 'Dr. Juan Perez',
        email: 'juan.perez@universidad.edu',
        password: '123456',
        role: 'profesor',
        numEmpleado: 'P00101',
        departamento: 'Ciencias Exactas'
      },
      {
        name: 'Mtra. Maria Gonzalez',
        email: 'maria.gonzalez@universidad.edu',
        password: '123456',
        role: 'profesor',
        numEmpleado: 'P00102',
        departamento: 'Ingenieria'
      },
      {
        name: 'Ing. Carlos Ramirez',
        email: 'carlos.ramirez@universidad.edu',
        password: '123456',
        role: 'profesor',
        numEmpleado: 'P00103',
        departamento: 'Ingenieria'
      },
      {
        name: 'Dra. Ana Martinez',
        email: 'ana.martinez@universidad.edu',
        password: '123456',
        role: 'profesor',
        numEmpleado: 'P00104',
        departamento: 'Ingenieria'
      }
    ]);
    console.log(`${profesores.length} profesores creados.`);

    // Admin
    await User.create({
      name: 'Administrador',
      email: 'admin@universidad.edu',
      password: '123456',
      role: 'admin'
    });
    console.log('1 admin creado.');

    // Alumno principal
    const alumnoPrincipal = await User.create({
      name: 'Juan Carlos Mendoza',
      email: 'alumno@universidad.edu',
      password: '123456',
      role: 'alumno',
      matricula: '20210001',
      carrera: 'Ingenieria en Sistemas Computacionales',
      semestre: '6to Semestre'
    });

    // Alumnos extra (los que aparecen en las listas del profesor)
    const alumnosExtra = await User.create([
      { name: 'Juan Perez Garcia', email: 'juan.pg@universidad.edu', password: '123456', role: 'alumno', matricula: '2024001', carrera: 'Ingenieria en Sistemas', semestre: '4to Semestre' },
      { name: 'Maria Gonzalez Lopez', email: 'maria.gl@universidad.edu', password: '123456', role: 'alumno', matricula: '2024002', carrera: 'Ingenieria en Sistemas', semestre: '4to Semestre' },
      { name: 'Carlos Ramirez Diaz', email: 'carlos.rd@universidad.edu', password: '123456', role: 'alumno', matricula: '2024003', carrera: 'Ingenieria en Sistemas', semestre: '4to Semestre' },
      { name: 'Ana Martinez Ruiz', email: 'ana.mr@universidad.edu', password: '123456', role: 'alumno', matricula: '2024004', carrera: 'Ingenieria en Sistemas', semestre: '4to Semestre' },
      { name: 'Roberto Sanchez Mora', email: 'roberto.sm@universidad.edu', password: '123456', role: 'alumno', matricula: '2024005', carrera: 'Ingenieria en Sistemas', semestre: '4to Semestre' },
      { name: 'Laura Torres Vega', email: 'laura.tv@universidad.edu', password: '123456', role: 'alumno', matricula: '2024010', carrera: 'Ingenieria Industrial', semestre: '3er Semestre' },
      { name: 'Diego Flores Reyes', email: 'diego.fr@universidad.edu', password: '123456', role: 'alumno', matricula: '2024011', carrera: 'Ingenieria Industrial', semestre: '3er Semestre' },
      { name: 'Sofia Hernandez Cruz', email: 'sofia.hc@universidad.edu', password: '123456', role: 'alumno', matricula: '2024012', carrera: 'Ingenieria Industrial', semestre: '3er Semestre' },
      { name: 'Miguel Angel Lopez', email: 'miguel.al@universidad.edu', password: '123456', role: 'alumno', matricula: '2024013', carrera: 'Ingenieria Industrial', semestre: '3er Semestre' },
      { name: 'Valentina Castro Ruiz', email: 'valentina.cr@universidad.edu', password: '123456', role: 'alumno', matricula: '2024020', carrera: 'Ingenieria Mecanica', semestre: '2do Semestre' },
      { name: 'Andres Morales Pena', email: 'andres.mp@universidad.edu', password: '123456', role: 'alumno', matricula: '2024021', carrera: 'Ingenieria Mecanica', semestre: '2do Semestre' },
      { name: 'Camila Ortega Silva', email: 'camila.os@universidad.edu', password: '123456', role: 'alumno', matricula: '2024022', carrera: 'Ingenieria Mecanica', semestre: '2do Semestre' }
    ]);
    console.log(`${alumnosExtra.length + 1} alumnos creados.`);

    const todosAlumnos = [alumnoPrincipal, ...alumnosExtra];

    // ==========================================
    // MATERIAS
    // ==========================================

    // Materias del alumno principal (las 4 que ve en su panel)
    const materias = await Materia.create([
      {
        nombre: 'Calculo Diferencial',
        grupo: 'A1',
        profesor: profesores[0]._id,
        alumnos: [alumnoPrincipal._id, alumnosExtra[0]._id, alumnosExtra[1]._id, alumnosExtra[2]._id, alumnosExtra[3]._id, alumnosExtra[4]._id],
        horario: 'Lun-Mie 8:00-10:00'
      },
      {
        nombre: 'Programacion Orientada a Objetos',
        grupo: 'B2',
        profesor: profesores[1]._id,
        alumnos: [alumnoPrincipal._id, alumnosExtra[5]._id, alumnosExtra[6]._id, alumnosExtra[7]._id, alumnosExtra[8]._id],
        horario: 'Mar-Jue 10:00-12:00'
      },
      {
        nombre: 'Base de Datos',
        grupo: 'A3',
        profesor: profesores[2]._id,
        alumnos: [alumnoPrincipal._id, alumnosExtra[9]._id, alumnosExtra[10]._id, alumnosExtra[11]._id],
        horario: 'Vie 14:00-18:00'
      },
      {
        nombre: 'Ingenieria de Software',
        grupo: 'C1',
        profesor: profesores[3]._id,
        alumnos: [alumnoPrincipal._id, alumnosExtra[0]._id, alumnosExtra[5]._id, alumnosExtra[9]._id],
        horario: 'Lun-Mie 14:00-16:00'
      }
    ]);

    // Materias extra del profesor 0 (Calculo Diferencial + Algebra Lineal + Fisica I)
    const materiasExtraProf = await Materia.create([
      {
        nombre: 'Algebra Lineal',
        grupo: 'B2',
        profesor: profesores[0]._id,
        alumnos: [alumnosExtra[5]._id, alumnosExtra[6]._id, alumnosExtra[7]._id, alumnosExtra[8]._id],
        horario: 'Mar-Jue 8:00-10:00'
      },
      {
        nombre: 'Fisica I',
        grupo: 'C1',
        profesor: profesores[0]._id,
        alumnos: [alumnosExtra[9]._id, alumnosExtra[10]._id, alumnosExtra[11]._id],
        horario: 'Vie 8:00-12:00'
      }
    ]);
    console.log(`${materias.length + materiasExtraProf.length} materias creadas.`);

    // ==========================================
    // ASISTENCIAS del alumno principal
    // ==========================================

    const asistenciasData = [];

    // Calculo Diferencial
    const fechasCalculo = [
      { fecha: '2026-01-19', estado: 'presente' },
      { fecha: '2026-01-18', estado: 'presente' },
      { fecha: '2026-01-16', estado: 'presente' },
      { fecha: '2026-01-14', estado: 'retardo', observaciones: 'Llego 15 min tarde' },
      { fecha: '2026-01-12', estado: 'presente' },
      { fecha: '2026-01-09', estado: 'falta', observaciones: 'Sin justificante' },
      { fecha: '2026-01-07', estado: 'presente' },
      { fecha: '2026-01-05', estado: 'presente' },
      { fecha: '2026-01-02', estado: 'falta', observaciones: 'Justificante medico' },
      { fecha: '2025-12-31', estado: 'presente' }
    ];
    fechasCalculo.forEach(a => {
      asistenciasData.push({
        alumno: alumnoPrincipal._id,
        materia: materias[0]._id,
        fecha: new Date(a.fecha),
        estado: a.estado,
        observaciones: a.observaciones || ''
      });
    });

    // POO
    const fechasPOO = [
      { fecha: '2026-01-20', estado: 'presente' },
      { fecha: '2026-01-15', estado: 'presente' },
      { fecha: '2026-01-13', estado: 'retardo', observaciones: 'Llego 12 min tarde' },
      { fecha: '2026-01-08', estado: 'presente' },
      { fecha: '2026-01-06', estado: 'retardo', observaciones: 'Llego 10 min tarde' },
      { fecha: '2026-01-01', estado: 'presente' }
    ];
    fechasPOO.forEach(a => {
      asistenciasData.push({
        alumno: alumnoPrincipal._id,
        materia: materias[1]._id,
        fecha: new Date(a.fecha),
        estado: a.estado,
        observaciones: a.observaciones || ''
      });
    });

    // Base de Datos
    const fechasBD = [
      { fecha: '2026-01-16', estado: 'presente' },
      { fecha: '2026-01-09', estado: 'falta', observaciones: 'Sin justificante' },
      { fecha: '2026-01-02', estado: 'presente' },
      { fecha: '2025-12-19', estado: 'falta', observaciones: 'Justificante medico' },
      { fecha: '2025-12-12', estado: 'presente' }
    ];
    fechasBD.forEach(a => {
      asistenciasData.push({
        alumno: alumnoPrincipal._id,
        materia: materias[2]._id,
        fecha: new Date(a.fecha),
        estado: a.estado,
        observaciones: a.observaciones || ''
      });
    });

    // Ingenieria de Software
    const fechasIS = [
      { fecha: '2026-01-19', estado: 'presente' },
      { fecha: '2026-01-14', estado: 'presente' },
      { fecha: '2026-01-12', estado: 'retardo', observaciones: 'Llego 11 min tarde' },
      { fecha: '2026-01-07', estado: 'presente' },
      { fecha: '2026-01-05', estado: 'falta', observaciones: 'Sin justificante' },
      { fecha: '2026-01-01', estado: 'presente' }
    ];
    fechasIS.forEach(a => {
      asistenciasData.push({
        alumno: alumnoPrincipal._id,
        materia: materias[3]._id,
        fecha: new Date(a.fecha),
        estado: a.estado,
        observaciones: a.observaciones || ''
      });
    });

    // Asistencias de otros alumnos (historial del profesor)
    const historialData = [
      { alumno: alumnosExtra[0]._id, materia: materias[0]._id, fecha: '2026-01-19', estado: 'presente' },
      { alumno: alumnosExtra[1]._id, materia: materias[0]._id, fecha: '2026-01-19', estado: 'presente' },
      { alumno: alumnosExtra[0]._id, materia: materias[0]._id, fecha: '2026-01-18', estado: 'retardo' },
      { alumno: alumnosExtra[1]._id, materia: materias[0]._id, fecha: '2026-01-18', estado: 'falta' },
      { alumno: alumnosExtra[0]._id, materia: materias[0]._id, fecha: '2026-01-16', estado: 'presente' },
      { alumno: alumnosExtra[1]._id, materia: materias[0]._id, fecha: '2026-01-16', estado: 'presente' },
      { alumno: alumnosExtra[2]._id, materia: materias[0]._id, fecha: '2026-01-14', estado: 'presente' },
      { alumno: alumnosExtra[3]._id, materia: materias[0]._id, fecha: '2026-01-14', estado: 'falta' },
      { alumno: alumnosExtra[5]._id, materia: materias[1]._id, fecha: '2026-01-19', estado: 'presente' },
      { alumno: alumnosExtra[6]._id, materia: materias[1]._id, fecha: '2026-01-19', estado: 'retardo' },
      { alumno: alumnosExtra[5]._id, materia: materias[1]._id, fecha: '2026-01-18', estado: 'falta' },
      { alumno: alumnosExtra[6]._id, materia: materias[1]._id, fecha: '2026-01-18', estado: 'presente' }
    ];
    historialData.forEach(h => {
      asistenciasData.push({
        alumno: h.alumno,
        materia: h.materia,
        fecha: new Date(h.fecha),
        estado: h.estado,
        observaciones: ''
      });
    });

    await Asistencia.insertMany(asistenciasData);
    console.log(`${asistenciasData.length} registros de asistencia creados.`);

    // ==========================================
    // REPORTES (justificantes)
    // ==========================================

    await Reporte.create([
      {
        alumno: alumnoPrincipal._id,
        titulo: 'Falta por enfermedad',
        descripcion: 'Incapacidad medica presentada',
        fechaSolicitud: new Date('2026-01-14'),
        estado: 'aprobado'
      },
      {
        alumno: alumnoPrincipal._id,
        titulo: 'Tramite administrativo',
        descripcion: 'Solicitud de justificante para tramite en rectoria',
        fechaSolicitud: new Date('2026-01-09'),
        estado: 'pendiente'
      },
      {
        alumno: alumnoPrincipal._id,
        titulo: 'Actividad extracurricular',
        descripcion: 'Participacion en torneo deportivo universitario',
        fechaSolicitud: new Date('2026-01-05'),
        estado: 'aprobado'
      },
      {
        alumno: alumnoPrincipal._id,
        titulo: 'Cita medica',
        descripcion: 'Consulta medica programada con especialista',
        fechaSolicitud: new Date('2026-01-02'),
        estado: 'rechazado'
      }
    ]);
    console.log('4 reportes creados.');

    // ==========================================
    // REPORTES DE LECTURA
    // ==========================================

    await ReporteLectura.create([
      {
        alumno: alumnoPrincipal._id,
        titulo: 'El Principito',
        autor: 'Antoine de Saint-Exupery',
        contenido: 'El Principito es una obra que nos invita a reflexionar sobre la importancia de los lazos afectivos y la esencia de las cosas que realmente importan en la vida. A traves de la historia de un pequeno principe que viaja por diferentes planetas, el autor nos muestra como los adultos pierden de vista lo esencial.',
        palabras: 350,
        fecha: new Date('2026-01-10'),
        estado: 'aprobado'
      },
      {
        alumno: alumnoPrincipal._id,
        titulo: 'Cien Anos de Soledad',
        autor: 'Gabriel Garcia Marquez',
        contenido: 'Cien Anos de Soledad narra la historia de la familia Buendia a lo largo de siete generaciones en el pueblo ficticio de Macondo. La obra es una representacion del realismo magico latinoamericano donde lo fantastico se mezcla con lo cotidiano de manera natural.',
        palabras: 420,
        fecha: new Date('2026-01-03'),
        estado: 'pendiente'
      },
      {
        alumno: alumnoPrincipal._id,
        titulo: 'Don Quijote de la Mancha',
        autor: 'Miguel de Cervantes',
        contenido: 'Don Quijote de la Mancha es considerada la primera novela moderna. La obra cuenta las aventuras de un hidalgo que pierde la razon leyendo libros de caballerias y decide convertirse en caballero andante, acompanado de su fiel escudero Sancho Panza.',
        palabras: 280,
        fecha: new Date('2025-12-20'),
        estado: 'aprobado'
      }
    ]);
    console.log('3 reportes de lectura creados.');

    // ==========================================
    // EVALUACION (solo la de Mtra. Maria Gonzalez ya evaluada)
    // ==========================================

    await Evaluacion.create({
      alumno: alumnoPrincipal._id,
      profesor: profesores[1]._id,
      materia: materias[1]._id,
      respuestas: {
        dominio_tema: 5,
        claridad: 4,
        puntualidad: 5,
        material_didactico: 4,
        disponibilidad: 5
      },
      comentarios: 'Excelente profesora, muy clara en sus explicaciones.'
    });
    console.log('1 evaluacion creada.');

    // ==========================================
    // LINEAMIENTOS
    // ==========================================

    await Lineamiento.create([
      // Asistencias
      { categoria: 'asistencias', tipo: 'success', titulo: 'Porcentaje minimo de asistencia:', descripcion: 'Se requiere un 80% de asistencia para tener derecho a calificacion ordinaria.' },
      { categoria: 'asistencias', tipo: 'success', titulo: 'Registro de asistencia:', descripcion: 'El alumno debe registrar su asistencia durante el horario de clase. El sistema solo permite el registro 10 minutos antes del inicio y hasta 20 minutos despues.' },
      { categoria: 'asistencias', tipo: 'success', titulo: 'Retardos:', descripcion: 'Se considera retardo el registro de asistencia entre 10 y 20 minutos despues de iniciada la clase. Tres retardos equivalen a una falta.' },
      { categoria: 'asistencias', tipo: 'warning', titulo: 'Faltas justificadas:', descripcion: 'Las faltas por enfermedad o situaciones extraordinarias deben ser justificadas mediante reporte en un plazo maximo de 3 dias habiles.' },
      // Calificaciones
      { categoria: 'calificaciones', tipo: 'success', titulo: 'Escala de calificacion:', descripcion: 'Las calificaciones se expresan en escala numerica de 0 a 100. La calificacion minima aprobatoria es 60.' },
      { categoria: 'calificaciones', tipo: 'success', titulo: 'Evaluacion ordinaria:', descripcion: 'Comprende las evaluaciones parciales, tareas, participaciones y examen final segun el programa de cada materia.' },
      { categoria: 'calificaciones', tipo: 'warning', titulo: 'Evaluacion extraordinaria:', descripcion: 'Los alumnos que no aprueben en ordinario tienen derecho a un examen extraordinario, siempre y cuando cumplan con el porcentaje minimo de asistencia.' },
      { categoria: 'calificaciones', tipo: 'success', titulo: 'Entrega de calificaciones:', descripcion: 'Los profesores deben registrar las calificaciones en el sistema dentro de los 5 dias habiles posteriores a la evaluacion.' }
    ]);
    console.log('8 lineamientos creados.');

    // ==========================================
    // RESUMEN
    // ==========================================

    console.log('\n========================================');
    console.log('  SEED COMPLETADO EXITOSAMENTE');
    console.log('========================================');
    console.log(`  Profesores:          ${profesores.length}`);
    console.log(`  Alumnos:             ${alumnosExtra.length + 1}`);
    console.log(`  Materias:            ${materias.length + materiasExtraProf.length}`);
    console.log(`  Asistencias:         ${asistenciasData.length}`);
    console.log('  Reportes:            4');
    console.log('  Reportes Lectura:    3');
    console.log('  Evaluaciones:        1');
    console.log('  Lineamientos:        8');
    console.log('========================================');
    console.log('\n  Credenciales de prueba:');
    console.log('  Admin:    admin@universidad.edu / 123456');
    console.log('  Alumno:   alumno@universidad.edu / 123456');
    console.log('  Profesor: juan.perez@universidad.edu / 123456');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error en seed:', error);
    process.exit(1);
  }
};

seed();
