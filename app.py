import jwt
from functools import wraps
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from sqlalchemy import func, extract


app = Flask(__name__)
CORS(app) # Habilita CORS para toda la aplicación
# Configuración de la conexión a SQL Server
# Asegúrate de reemplazar los valores con los de tu servidor
app.config['SQLALCHEMY_DATABASE_URI'] = 'mssql+pyodbc://sa:sistemaS12.6@LAPCARLITOS\SQLEXPRESS/GastosAppDB?driver=ODBC+Driver+17+for+SQL+Server'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


db = SQLAlchemy(app)

# Definición de los modelos de las tablas
class User(db.Model):
    __tablename__ = 'Users'
    Id = db.Column(db.Integer, primary_key=True)
    Username = db.Column(db.String(50), nullable=False)
    Email = db.Column(db.String(100), nullable=False, unique=True)
    PasswordHash = db.Column(db.String(255), nullable=False)

class Category(db.Model):
    __tablename__ = 'Categories'
    Id = db.Column(db.Integer, primary_key=True)
    Name = db.Column(db.String(50), nullable=False)
    UserId = db.Column(db.Integer, db.ForeignKey('Users.Id'))

class Expense(db.Model):
    __tablename__ = 'Expenses'
    Id = db.Column(db.Integer, primary_key=True)
    Amount = db.Column(db.Numeric(10, 2), nullable=False)
    Description = db.Column(db.String(255))
    Date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    UserId = db.Column(db.Integer, db.ForeignKey('Users.Id'))
    CategoryId = db.Column(db.Integer, db.ForeignKey('Categories.Id'))

# Nota: También necesitarás definir los modelos para Category y Expense

# Ruta de Registro de Usuario
@app.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'message': 'Faltan datos requeridos'}), 400

    # Verificar si el usuario ya existe
    existing_user = User.query.filter_by(Email=email).first()
    if existing_user:
        return jsonify({'message': 'El correo electrónico ya está registrado'}), 409

    # Encriptar la contraseña antes de guardarla
    password_hash = generate_password_hash(password)

    # Crear y guardar el nuevo usuario
    new_user = User(Username=username, Email=email, PasswordHash=password_hash)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'Usuario registrado exitosamente'}), 201


# Secreta para el token JWT. ¡Cámbiala por una cadena compleja y segura!
app.config['SECRET_KEY'] = '12345678'

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Intenta obtener el token del encabezado 'Authorization'
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]

        if not token:
            return jsonify({'message': 'Falta el token de autenticación'}), 401

        try:
            # Decodifica el token para obtener los datos del usuario
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(Id=data['user_id']).first()
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'El token ha expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token inválido'}), 401

        return f(current_user, *args, **kwargs)

    return decorated

# Ruta de Inicio de Sesión
@app.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Faltan datos requeridos'}), 400

    # Buscar el usuario por correo electrónico
    user = User.query.filter_by(Email=email).first()

    if user and check_password_hash(user.PasswordHash, password):
        # Generar el token
        token = jwt.encode({'user_id': user.Id}, app.config['SECRET_KEY'], algorithm="HS256")
        return jsonify({'message': 'Inicio de sesión exitoso', 'token': token}), 200

    return jsonify({'message': 'Credenciales inválidas'}), 401

    # Verificar si el usuario existe y si la contraseña es correcta
    if not user or not check_password_hash(user.PasswordHash, password):
        return jsonify({'message': 'Credenciales inválidas'}), 401

    # Aquí se podría generar un token JWT para mantener la sesión
    return jsonify({'message': 'Inicio de sesión exitoso'}), 200


# Ruta para obtener todas las categorías del usuario
@app.route('/categories', methods=['GET'])
@token_required
def get_categories(current_user):
    categories = Category.query.filter_by(UserId=current_user.Id).all()
    output = []
    for category in categories:
        output.append({'id': category.Id, 'name': category.Name})
    return jsonify({'categories': output}), 200


# Ruta para crear una nueva categoría
@app.route('/categories', methods=['POST'])
@token_required
def create_category(current_user):
    data = request.get_json()
    new_category = Category(Name=data['name'], UserId=current_user.Id)
    db.session.add(new_category)
    db.session.commit()
    return jsonify({'message': 'Categoría creada exitosamente'}), 201


# Ruta para eliminar una categoría
@app.route('/categories/<int:category_id>', methods=['DELETE'])
@token_required
def delete_category(current_user, category_id):
    category = Category.query.filter_by(Id=category_id, UserId=current_user.Id).first()
    if not category:
        return jsonify({'message': 'Categoría no encontrada o no tienes permiso para eliminarla'}), 404

    db.session.delete(category)
    db.session.commit()
    return jsonify({'message': 'Categoría eliminada exitosamente'}), 200


# Ruta para obtener todos los gastos del usuario
@app.route('/expenses', methods=['GET'])
@token_required
def get_expenses(current_user):
    expenses = Expense.query.filter_by(UserId=current_user.Id).all()
    output = []
    for expense in expenses:
        output.append({
            'id': expense.Id,
            'amount': str(expense.Amount), # Convertir a string para JSON
            'description': expense.Description,
            'date': expense.Date.isoformat(), # Formato ISO para la fecha
            'categoryId': expense.CategoryId
        })
    return jsonify({'expenses': output}), 200

# Ruta para crear un nuevo gasto
@app.route('/expenses', methods=['POST'])
@token_required
def create_expense(current_user):
    data = request.get_json()
    new_expense = Expense(
        Amount=data['amount'],
        Description=data['description'],
        Date=datetime.strptime(data['date'], '%Y-%m-%d').date(), # Convierte el string a objeto de fecha
        UserId=current_user.Id,
        CategoryId=data['categoryId']
    )
    db.session.add(new_expense)
    db.session.commit()
    return jsonify({'message': 'Gasto registrado exitosamente'}), 201

# Ruta para obtener el resumen de gastos por categoría
@app.route('/reports/by-category', methods=['GET'])
@token_required
def get_report_by_category(current_user):
    # Consulta la base de datos para agrupar los gastos por categoría
    results = db.session.query(
        Category.Name,
        func.sum(Expense.Amount).label('total_amount')
    ).join(Expense).filter(
        Expense.UserId == current_user.Id
    ).group_by(Category.Name).all()

    report_data = [{'category': row.Name, 'total': float(row.total_amount)} for row in results]
    return jsonify(report_data), 200

# Ruta para obtener el resumen de gastos por mes
@app.route('/reports/by-month', methods=['GET'])
@token_required
def get_report_by_month(current_user):
    # Consulta para agrupar los gastos por mes y año
    results = db.session.query(
        extract('year', Expense.Date).label('year'),
        extract('month', Expense.Date).label('month'),
        func.sum(Expense.Amount).label('total_amount')
    ).filter(
        Expense.UserId == current_user.Id
    ).group_by(
        extract('year', Expense.Date),
        extract('month', Expense.Date)
    ).order_by('year', 'month').all()

    report_data = [{
        'year': int(row.year),
        'month': int(row.month),
        'total': float(row.total_amount)
    } for row in results]
    return jsonify(report_data), 200

if __name__ == '__main__':
    app.run(debug=True)